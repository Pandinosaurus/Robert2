<?php
declare(strict_types=1);

namespace Loxya\Models;

use Adbar\Dot as DotArray;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Loxya\Contracts\PeriodInterface;
use Loxya\Contracts\Serializable;
use Loxya\Models\Traits\Serializer;
use Loxya\Support\Period;
use Respect\Validation\Validator as V;

/**
 * Technicien mandaté sur un événement.
 *
 * @property-read ?int $id
 * @property-read int $event_id
 * @property-read Event $event
 * @property-read int $technician_id
 * @property-read Technician $technician
 * @property string $start_date
 * @property string $end_date
 * @property Period $period
 * @property string|null $position
 *
 * @method static Builder|static inPeriod(PeriodInterface $period)
 * @method static Builder|static inPeriod(string|\DateTimeInterface $start, string|\DateTimeInterface|null $end)
 * @method static Builder|static inPeriod(string|\DateTimeInterface|PeriodInterface $start, string|\DateTimeInterface|null $end = null)
 */
final class EventTechnician extends BaseModel implements Serializable
{
    use Serializer;

    // - Types de sérialisation.
    public const SERIALIZE_FOR_EVENT = 'default-for-event';
    public const SERIALIZE_FOR_TECHNICIAN = 'default-for-technician';

    public $timestamps = false;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        $this->validation = [
            'event_id' => V::custom([$this, 'checkEventId']),
            'technician_id' => V::custom([$this, 'checkTechnicianId']),
            'start_date' => V::custom([$this, 'checkDates']),
            'end_date' => V::custom([$this, 'checkDates']),
            'position' => V::nullable(V::length(2, 191)),
        ];
    }

    // ------------------------------------------------------
    // -
    // -    Validation
    // -
    // ------------------------------------------------------

    public function checkEventId($value)
    {
        V::nullable(V::intVal())->check($value);

        // - L'identifiant de l’événement n'est pas encore défini, on skip.
        if (!$this->exists && $value === null) {
            return true;
        }

        $event = Event::withTrashed()->find($value);
        if (!$event) {
            return false;
        }

        return !$this->exists || $this->isDirty('event_id')
            ? !$event->trashed()
            : true;
    }

    public function checkTechnicianId($value)
    {
        V::notEmpty()->intVal()->check($value);

        $technician = Technician::withTrashed()->find($value);
        if (!$technician) {
            return false;
        }

        return !$this->exists || $this->isDirty('technician_id')
            ? !$technician->trashed()
            : true;
    }

    public function checkDates()
    {
        $dateChecker = V::notEmpty()->dateTime();

        $startDateRaw = $this->getAttributeUnsafeValue('start_date');
        if (!$dateChecker->validate($startDateRaw)) {
            return false;
        }

        $endDateRaw = $this->getAttributeUnsafeValue('end_date');
        if (!$dateChecker->validate($endDateRaw)) {
            return false;
        }

        $start = new CarbonImmutable($startDateRaw);
        $end = new CarbonImmutable($endDateRaw);
        if ($start >= $end) {
            return 'end-date-must-be-after-start-date';
        }
        $period = new Period($start, $end);

        // - La période d'assignation est comprise dans l'intervalle des
        //   périodes de mobilisations et d'opération de l'événement.
        $maxAssignationPeriod = $this->event->mobilization_period
            ->merge($this->event->operation_period);

        if (!$maxAssignationPeriod->contain($period)) {
            return 'technician-assignation-period-outside-event-period';
        }

        // - Les dates doivent être arrondis aux quart d'heure le plus proche.
        if (
            !$start->roundMinutes(15)->eq($start) ||
            !$end->roundMinutes(15)->eq($end)
        ) {
            return 'date-precision-must-be-quarter';
        }

        $isAlreadyBusy = static::query()
            ->where('technician_id', $this->technician_id)
            ->inPeriod($period)
            ->when($this->exists, fn (Builder $subQuery) => (
                $subQuery->where('id', '!=', $this->id)
            ))
            ->exists();

        return !$isAlreadyBusy ?: 'technician-already-busy-for-this-period';
    }

    // ------------------------------------------------------
    // -
    // -    Relations
    // -
    // ------------------------------------------------------

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id')
            ->withTrashed();
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(Technician::class, 'technician_id')
            ->withTrashed();
    }

    // ------------------------------------------------------
    // -
    // -    Mutators
    // -
    // ------------------------------------------------------

    protected $casts = [
        'event_id' => 'integer',
        'technician_id' => 'integer',
        'start_date' => 'string',
        'end_date' => 'string',
        'position' => 'string',
    ];

    public function getPeriodAttribute(): Period
    {
        return new Period($this->start_date, $this->end_date);
    }

    public function getTechnicianAttribute(): Technician
    {
        return $this->getRelationValue('technician');
    }

    public function getEventAttribute(): Event
    {
        return $this->getRelationValue('event');
    }

    // ------------------------------------------------------
    // -
    // -    Setters
    // -
    // ------------------------------------------------------

    protected $fillable = [
        'event_id',
        'technician_id',
        'start_date',
        'end_date',
        'period',
        'position',
    ];

    public function setPeriodAttribute(mixed $rawPeriod): void
    {
        $period = Period::tryFrom($rawPeriod);

        $this->start_date = $period?->getStartDate()->format('Y-m-d H:i:s');
        $this->end_date = $period?->getEndDate()->format('Y-m-d H:i:s');
    }

    public function setPositionAttribute(mixed $value): void
    {
        $value = is_string($value) ? trim($value) : $value;
        $this->attributes['position'] = $value;
    }

    // ------------------------------------------------------
    // -
    // -    Méthodes liées à une "entity"
    // -
    // ------------------------------------------------------

    /**
     * Permet de calculer, à partir d'une nouvelle période de référence, la nouvelle
     * période d'assignation du présent technicien.
     *
     * Si l'assignation pendant la nouvelle période de référence n'est pas possible, `null` sera retourné.
     *
     * @param Period $newRefPeriod La nouvelle période référence (dans laquelle l'assignation doit être contenue).
     *
     * @return Period|null La nouvelle période d'assignation si elle est possible, `null` sinon.
     */
    public function computeNewPeriod(Period $newRefPeriod): Period|null
    {
        $newRefPeriodStart = $newRefPeriod->getStartDate();
        $newRefPeriodEnd = $newRefPeriod->getEndDate();

        $periodStart = $this->period->getStartDate()->roundMinutes(15);
        $periodEnd = $this->period->getEndDate()->roundMinutes(15);

        // - Si l'assignation se retrouve en dehors de la nouvelle période
        //   => Il n'y a pas de nouvelle période (et donc théoriquement plus d'assignation).
        if ($periodStart >= $newRefPeriodEnd) {
            return null;
        }
        if ($periodEnd <= $newRefPeriodStart) {
            return null;
        }

        // - Sinon on ajuste pour rester dans le nouvel intervalle.
        if ($periodStart < $newRefPeriodStart) {
            $periodStart = $newRefPeriodStart
                ->roundMinutes(15, 'ceil');
        }
        if ($periodEnd > $newRefPeriodEnd) {
            $periodEnd = $newRefPeriodEnd
                ->roundMinutes(15, 'floor');
        }
        if ($periodStart >= $periodEnd) {
            return null;
        }

        return new Period($periodStart, $periodEnd);
    }

    // ------------------------------------------------------
    // -
    // -    Query Scopes
    // -
    // ------------------------------------------------------

    /**
     * @param Builder $query
     * @param string|\DateTimeInterface|PeriodInterface $start
     * @param string|\DateTimeInterface|null $end (optional)
     */
    public function scopeInPeriod(Builder $query, $start, $end = null): Builder
    {
        if ($start instanceof PeriodInterface) {
            $end = $start->getEndDate();
            $start = $start->getStartDate();
        }

        // - Si pas de date de fin: Période de 24 heures.
        $start = new CarbonImmutable($start);
        $end = new CarbonImmutable($end ?? $start->addDay());

        return $query
            ->whereRelation('event', 'deleted_at', null)
            ->where([
                ['start_date', '<', $end],
                ['end_date', '>', $start],
            ]);
    }

    // ------------------------------------------------------
    // -
    // -    Serialization
    // -
    // ------------------------------------------------------

    public function serialize(string $format = self::SERIALIZE_FOR_EVENT): array
    {
        /** @var EventTechnician $eventTechnician */
        $eventTechnician = tap(clone $this, static function (EventTechnician $eventTechnician) use ($format) {
            $eventTechnician->append(['period']);

            if ($format === self::SERIALIZE_FOR_EVENT) {
                $eventTechnician->append('technician');
            }
            if ($format === self::SERIALIZE_FOR_TECHNICIAN) {
                $eventTechnician->append('event');
            }
        });

        return (new DotArray($eventTechnician->attributesForSerialization()))
            ->delete(['start_date', 'end_date'])
            ->all();
    }

    public static function serializeValidation(array $data): array
    {
        $data = new DotArray($data);

        // - Période d'assignation.
        $periodErrors = array_unique(array_filter([
            $data->get('start_date'),
            $data->get('end_date'),
        ]));
        if (!empty($periodErrors)) {
            $data->set('period', (
                count($periodErrors) === 1
                    ? current($periodErrors)
                    : implode("\n", array_map(
                        static fn ($message) => sprintf('- %s', $message),
                        $periodErrors,
                    ))
            ));
        }
        $data->delete('start_date');
        $data->delete('end_date');

        return $data->all();
    }
}

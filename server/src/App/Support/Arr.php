<?php
declare(strict_types=1);

namespace Loxya\Support;

use Illuminate\Support\Arr as ArrCore;

class Arr extends ArrCore
{
    /**
     * Permet de mapper sur un tableau tout en ayant accès aux clés de celui-ci.
     *
     * @param callable $callback Un callback qui sera appelé avec la clé et la valeur
     *                           et qui devra retourner une nouvelle valeur pour cette clé.
     * @param array    $array    Le tableau à mapper.
     *
     * @return array Un nouveau tableau dont les valeurs seront celles retournées par le callback.
     *               (Les clés, elles, resteront inchangées)
     */
    public static function mapKeys(callable $callback, array $array): array
    {
        $keys = array_keys($array);
        return array_combine($keys, array_map($callback, $keys, $array));
    }

    /**
     * Permet de compléter un tableau avec des valeurs par défaut si celui-ci ne les contient pas.
     *
     * @example
     * ```php
     * $array = Arr:defaults($options, ['recursive' => false]);
     * // => Si `recursive` était défini dans `$options`, sa valeur sera conservée.
     * // => Si `recursive` n'était pas défini dans `$options`, sa valeur sera `false`.
     * ```
     *
     * @param array $array - Le tableau dans lequel on doit vérifier la présence des défauts.
     * @param array $defaults - Les valeurs par défaut.
     *
     * @return array Un nouveau tableau avec les valeurs par défaut si celles-ci n'était pas déjà définies.
     */
    public static function defaults(array $array, array $defaults): array
    {
        return array_replace($defaults, $array);
    }
}

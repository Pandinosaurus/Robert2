<?php
declare(strict_types=1);

use Loxya\Config\Config;
use Phinx\Migration\AbstractMigration;

final class CreateParks extends AbstractMigration
{
    public function up(): void
    {
        $parks = $this->table('parks', ['signed' => true]);
        $parks
            ->addColumn('name', 'string', ['length' => 96, 'null' => false])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->addIndex(['name'], [
                'unique' => true,
                'name' => 'name_UNIQUE',
            ])
            ->create();

        //
        // - Data
        //

        $defaultNameTranslations = [
            'en' => 'Internal',
            'fr' => 'Interne',
        ];

        $lang = Config::get('defaultLang');
        $defaultName = $defaultNameTranslations['en'];
        if ($lang && array_key_exists($lang, $defaultNameTranslations)) {
            $defaultName = $defaultNameTranslations[$lang];
        }

        $now = date('Y-m-d H:i:s');
        $parks
            ->insert([
                'name' => $defaultName,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->save();
    }

    public function down(): void
    {
        $this->table('parks')->drop()->save();
    }
}

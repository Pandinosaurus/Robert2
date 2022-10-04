<?php
use Phinx\Migration\AbstractMigration;

class CreateCountries extends AbstractMigration
{
    public function up()
    {
        $countries = $this->table('countries');
        $countries
            ->addColumn('name', 'string', ['length' => 96])
            ->addColumn('code', 'string', ['length' => 4])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->addIndex(['name'], [
                'unique' => true,
                'name' => 'name_UNIQUE'
            ])
            ->addIndex(['code'], [
                'unique' => true,
                'name' => 'code_UNIQUE'
            ])
            ->create();

        //
        // - Données
        //

        $now = date('Y-m-d H:i:s');
        $data = array_map(
            fn($country) => array_replace($country, [
                'created_at' => $now,
                'updated_at' => $now,
            ]),
            include __DIR__ . DS . 'data' . DS . 'countries.php',
        );
        $countries->insert($data)->save();
    }

    public function down()
    {
        $this->table('countries')->drop()->save();
    }
}

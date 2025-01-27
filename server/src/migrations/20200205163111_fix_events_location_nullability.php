<?php
declare(strict_types=1);

use Loxya\Config\Config;
use Phinx\Migration\AbstractMigration;

final class FixEventsLocationNullability extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('events');
        $table
            ->changeColumn('location', 'string', ['null' => true, 'length' => 64])
            ->update();

        $prefix = Config::get('db.prefix');
        $this->execute(sprintf(
            "UPDATE `%sevents` SET `location` = NULL WHERE `location` = ''",
            $prefix,
        ));
    }

    public function down(): void
    {
        $prefix = Config::get('db.prefix');
        $this->execute(sprintf(
            "UPDATE `%sevents` SET `location` = '' WHERE `location` IS NULL",
            $prefix,
        ));

        $table = $this->table('events');
        $table
            ->changeColumn('location', 'string', [
                'length' => 64,
                'null' => false,
            ])
            ->update();
    }
}

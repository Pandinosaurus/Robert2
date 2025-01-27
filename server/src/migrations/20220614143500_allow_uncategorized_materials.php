<?php
declare(strict_types=1);

use Cake\Database\Query;
use Cake\Database\Query\SelectQuery;
use Cake\Database\Query\UpdateQuery;
use Loxya\Config\Config;
use Phinx\Migration\AbstractMigration;

final class AllowUncategorizedMaterials extends AbstractMigration
{
    public function up(): void
    {
        $materials = $this->table('materials');
        $materials
            ->changeColumn('category_id', 'integer', [
                'signed' => true,
                'null' => true,
            ])
            ->dropForeignKey('category_id', 'fk_materials_category')
            ->save();

        $materials
            ->addForeignKey('category_id', 'categories', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_materials_category',
            ])
            ->save();
    }

    public function down(): void
    {
        $prefix = Config::get('db.prefix');
        $noCategoryName = 'Non catégorisé';

        $categories = $this->table('categories');
        $categories->insert(['name' => $noCategoryName])->saveData();

        /** @var SelectQuery $qb */
        $qb = $this->getQueryBuilder(Query::TYPE_SELECT);
        $category = $qb
            ->select(['id'])
            ->from(sprintf('%scategories', $prefix))
            ->where(['name' => $noCategoryName])
            ->execute()->fetch('assoc');

        $materials = $this->table('materials');
        $materials
            ->dropForeignKey('category_id', 'fk_materials_category')
            ->save();

        /** @var UpdateQuery $qb */
        $qb = $this->getQueryBuilder(Query::TYPE_UPDATE);
        $qb
            ->update(sprintf('%smaterials', $prefix))
            ->set('category_id', $category['id'])
            ->where(['category_id IS' => null])
            ->execute();

        $materials
            ->changeColumn('category_id', 'integer', ['signed' => true, 'null' => false])
            ->addForeignKey('category_id', 'categories', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_materials_category',
            ])
            ->save();
    }
}

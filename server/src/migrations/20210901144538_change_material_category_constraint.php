<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ChangeMaterialCategoryConstraint extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('materials');
        $table->dropForeignKey('category_id', 'fk_materials_category')->save();
        $table
            ->addForeignKey('category_id', 'categories', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_materials_category',
            ])
            ->save();

        $categories = $this->table('categories');
        $categories
            ->removeColumn('deleted_at')
            ->save();

        $subcategories = $this->table('sub_categories');
        $subcategories
            ->removeColumn('deleted_at')
            ->save();
    }

    public function down(): void
    {
        $table = $this->table('materials');
        $table->dropForeignKey('category_id', 'fk_materials_category')->save();
        $table
            ->addForeignKey('category_id', 'categories', 'id', [
                'delete' => 'CASCADE',
                'update' => 'NO_ACTION',
                'constraint' => 'fk_materials_category',
            ])
            ->save();

        $categories = $this->table('categories');
        $categories
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->save();

        $subcategories = $this->table('sub_categories');
        $subcategories
            ->addColumn('deleted_at', 'datetime', ['null' => true])
            ->save();
    }
}

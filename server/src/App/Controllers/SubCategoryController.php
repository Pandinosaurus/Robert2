<?php
declare(strict_types=1);

namespace Loxya\Controllers;

use Loxya\Controllers\Traits\Crud;

final class SubCategoryController extends BaseController
{
    use Crud\Create;
    use Crud\Update;
    use Crud\HardDelete;
}

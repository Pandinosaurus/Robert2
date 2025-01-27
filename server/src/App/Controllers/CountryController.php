<?php
declare(strict_types=1);

namespace Loxya\Controllers;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Loxya\Controllers\Traits\Crud;
use Loxya\Http\Request;
use Loxya\Models\Country;
use Psr\Http\Message\ResponseInterface;
use Slim\Http\Response;

final class CountryController extends BaseController
{
    use Crud\GetOne;

    public function getAll(Request $request, Response $response): ResponseInterface
    {
        $countries = Country::orderBy('id', 'asc')->get();
        return $response->withJson($countries, StatusCode::STATUS_OK);
    }
}

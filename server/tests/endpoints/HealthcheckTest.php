<?php
declare(strict_types=1);

namespace Loxya\Tests;

use Fig\Http\Message\StatusCodeInterface as StatusCode;

final class HealthcheckTest extends ApiTestCase
{
    public function testHealthcheck(): void
    {
        $this->client->get('/healthcheck');
        $this->assertStatusCode(StatusCode::STATUS_OK);
        $this->assertResponseData(['last_update' => '2024-02-14 14:22:36']);
    }

    public function testHealthcheckDisabled(): void
    {
        static::setCustomConfig(['healthcheck' => false]);

        $this->client->get('/healthcheck');
        $this->assertStatusCode(StatusCode::STATUS_NOT_FOUND);
        $this->assertResponseData([
            'success' => false,
            'error' => [
                'code' => 0,
                'message' => "Health check not enabled.",
                'debug' => [
                    'requested' => '(GET) /healthcheck',
                ],
            ],
        ]);
    }
}

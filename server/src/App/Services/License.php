<?php
declare(strict_types=1);

namespace Loxya\Services;

use Loxya\Config\Config;
use Loxya\Http\Request;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

final class License
{
    private CacheItemPoolInterface $cache;

    public function __construct(CacheItemPoolInterface $cache)
    {
        $this->cache = $cache;
    }

    public function middleware(Request $request, RequestHandler $handler)
    {
        $this->cacheRemoteLicense();

        return $handler->handle($request);
    }

    public static function id(): ?string
    {
        if (!function_exists('sg_get_const')) {
            return null;
        }

        $licenseId = sg_get_const('licenseId');
        return is_string($licenseId) || is_numeric($licenseId)
            ? (string) $licenseId
            : null;
    }

    public static function mode(): ?string
    {
        if (!function_exists('sg_get_const')) {
            return 'live';
        }

        $licenseMode = sg_get_const('licenseMode');
        return in_array($licenseMode, ['live', 'deferred', 'offline'], true)
            ? $licenseMode
            : 'live';
    }

    // ------------------------------------------------------
    // -
    // -    Méthodes internes
    // -
    // ------------------------------------------------------

    private function cacheRemoteLicense(bool $force = false): void
    {
        if (static::mode() === 'offline') {
            return;
        }

        $lastRetrieval = $this->cache->getItem('license.last_retrieval');
        $licenseCacheFile = CACHE_FOLDER . DS . 'loxya.lic';

        $licenseId = static::id();
        if ($licenseId === null) {
            @unlink($licenseCacheFile);
            $this->cache->deleteItem($lastRetrieval->getKey());
            return;
        }

        $licenceFileExists = @file_exists($licenseCacheFile);
        if (!$licenceFileExists) {
            $this->cache->deleteItem($lastRetrieval->getKey());
        }

        // - Si le fetching n'est pas forcé et que la version en cache est encore valide => On ne fetch pas.
        if ($force !== true && $licenceFileExists && $lastRetrieval->isHit()) {
            $lastRetrievalDate = \DateTime::createFromFormat('!Y-m-d', $lastRetrieval->get());
            if ($lastRetrievalDate && $lastRetrievalDate >= new \DateTime('today')) {
                return;
            }
        }

        // - Récupération de la licence.
        $streamContextHttp = [
            'method' => 'GET',
            'timeout' => 5,
        ];

        $proxy = Config::get('proxy');
        if ($proxy && $proxy['enabled']) {
            $streamContextHttp = array_replace($streamContextHttp, [
                'proxy' => sprintf('tcp://%s:%d', $proxy['host'], $proxy['port']),
                'request_fulluri' => true,
            ]);
        }

        $streamContext = stream_context_create(['http' => $streamContextHttp]);
        $url = sprintf('https://client.loxya.com/licenses/%s', urlencode($licenseId));
        $license = @file_get_contents($url, false, $streamContext);
        if ($license === false) {
            debug("[License] La récupération du fichier de licence a échoué.");
            return;
        }

        // - Écriture dans le fichier de cache local.
        if (@file_put_contents($licenseCacheFile, $license, LOCK_EX) === false) {
            debug("[License] Le fichier de licence n'a pas pu être mis en cache.");
            return;
        }
        $lastRetrieval->set(date('Y-m-d'));
        $this->cache->save($lastRetrieval);
    }
}

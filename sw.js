// Service worker do Controle Financeiro: deixa o app instalavel e abrindo sem internet.
const CACHE = 'fc-v29';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Arquivos do app: tenta a internet primeiro (pega atualizacoes), senao usa o salvo
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Biblioteca do Firebase: usa a salva (nao muda)
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return resp; })));
  }
  // Banco de dados e login do Firebase: sempre direto pela internet (o Firebase cuida do offline)
});

(function () {
  // Origem das vendas: os links de compra levam sck=vitrine para o relatório "Origem" da Hotmart.
  // Se o visitante chegou por um link com ?origem=instagram (ou utm_source=...), vira sck=vitrine_instagram.
  // A origem fica guardada na sessão para valer também nas páginas de produto.
  var origem = '';
  try {
    var params = new URLSearchParams(location.search);
    origem = (params.get('origem') || params.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    if (origem) sessionStorage.setItem('vitrine-origem', origem);
    else origem = sessionStorage.getItem('vitrine-origem') || '';
  } catch (e) { /* sem sessionStorage: segue só com "vitrine" */ }
  if (origem) {
    document.querySelectorAll('a[href*="hotmart.com"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        u.searchParams.set('sck', 'vitrine_' + origem);
        a.href = u.toString();
      } catch (e) { /* link inválido: deixa como está */ }
    });
  }

  // Botões "Compartilhar": abre o menu do celular ou copia o link.
  document.querySelectorAll('[data-compartilhar]').forEach(function (botao) {
    var rotulo = botao.querySelector('span');
    var original = rotulo.textContent;
    botao.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      var copiado = function () {
        rotulo.textContent = 'Link copiado!';
        setTimeout(function () { rotulo.textContent = original; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(copiado, function () { prompt('Copie o link:', url); });
      } else {
        prompt('Copie o link:', url);
      }
    });
  });

  // Busca (só aparece quando há muitos produtos).
  var busca = document.getElementById('busca');
  if (busca) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('#grade .card'));
    var vazio = document.getElementById('vazio');
    var normalizar = function (s) {
      return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    };
    busca.addEventListener('input', function () {
      var termo = normalizar(busca.value);
      var visiveis = 0;
      cards.forEach(function (c) {
        var mostra = !termo || c.getAttribute('data-busca').indexOf(termo) !== -1;
        c.hidden = !mostra;
        if (mostra) visiveis++;
      });
      vazio.hidden = visiveis > 0;
    });
  }

  // Barra fixa de compra no celular: aparece quando o botão principal sai da tela.
  var cta = document.getElementById('cta');
  var barra = document.getElementById('barra-compra');
  if (cta && barra) {
    var agendado = false;
    var atualizar = function () {
      agendado = false;
      barra.classList.toggle('visivel', cta.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener('scroll', function () {
      if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }
})();

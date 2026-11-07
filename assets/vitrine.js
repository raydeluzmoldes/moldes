(function () {
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
  if (cta && barra && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      var e = entradas[0];
      barra.classList.toggle('visivel', !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(cta);
  }
})();

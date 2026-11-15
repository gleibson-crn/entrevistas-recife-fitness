(function(){
  // ---------- Armazenamento local (funciona sem internet) ----------
  var KEY='cf-feira-recife-2026';          // entrevistas salvas
  var DRAFT=KEY+'-rascunho';                // entrevista em andamento (salva a cada toque)
  var BK=KEY+'-backup';                     // quando foi o último backup/exportação
  function load(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){toast('Memória do navegador cheia. Exporte as entrevistas agora.');return false}}
  var all=load(KEY,[]);
  function persist(){return save(KEY,all)}
  if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().catch(function(){})}

  var Q=[
    {id:'quem',k:'Quem está falando',t:'Com quem você está conversando?',type:'form',fields:[
      {id:'nome',l:'Nome da pessoa',ph:'Como ela se apresentou'},
      {id:'academia',l:'Nome da academia',ph:'Academia'},
      {id:'instagram',l:'Instagram da academia (da principal, se tiver mais de uma)',ph:'@academia'},
      {id:'local',l:'Cidade e bairro',ph:'Ex.: Recife, Casa Amarela'}]},
    {id:'cargo',k:'Quem está falando',t:'Qual é o papel dela na academia?',type:'one',o:['Dono ou sócio','Gerente','Recepção ou financeiro','Professor','Outro']},
    {id:'rede',k:'Tamanho',t:'A academia faz parte de uma rede ou franquia?',type:'one',o:['Não, é independente','Sim, é de uma rede ou franquia']},
    {id:'unidades',k:'Tamanho',t:'Quantas unidades a academia tem?',type:'one',o:['1','2','3','4 ou mais']},
    {id:'alunos',k:'Tamanho',t:'Quantos alunos ativos a academia tem hoje?',hint:'Somando todas as unidades.',type:'one',o:['Até 150','De 151 a 200','De 201 a 600','De 601 a 1.000','Mais de 1.000','Não sabe']},
    {id:'valores',k:'Tamanho',t:'Quanto custam os planos da academia?',hint:'Em reais por mês. Preencha o que a pessoa souber.',type:'form',fields:[
      {id:'planoMin',l:'Plano mais barato',ph:'Ex.: 79,90',num:true},
      {id:'planoMax',l:'Plano mais caro',ph:'Ex.: 149,90',num:true},
      {id:'ticket',l:'Ticket médio, se souber',ph:'Ex.: 99,90',num:true}]},
    {id:'controle',k:'Como funciona hoje',t:'Como vocês controlam alunos e pagamentos?',type:'one',o:['Sistema de gestão','Planilha ou caderno','Os dois juntos'],extra:{id:'sistema',l:'Qual sistema?',ph:'Ex.: EVO, Next Fit, MU',show:function(a){return a.controle!=='Planilha ou caderno'}}},
    {id:'custo',k:'Como funciona hoje',t:'Quanto pagam hoje pelo sistema, somando tudo?',hint:'Assinatura, taxas e cobrança por movimentação. Se não souber, deixe em branco.',type:'text',ph:'Ex.: R$ 300 + taxas, uns R$ 800'},
    {id:'evasao',k:'Evasão',t:'Sabe quantos alunos perdeu no mês passado?',type:'one',o:['Sabe o número exato','Tem uma ideia','Não sabe'],extra:{id:'evasaoN',l:'Quantos, mais ou menos?',ph:'Ex.: 15',show:function(a){return a.evasao&&a.evasao!=='Não sabe'}}},
    {id:'origem',k:'Evasão',t:'Sabe de onde vêm os alunos?',hint:'Indicação, promoção, anúncio ou evento.',type:'one',o:['Sabe para cada aluno','Sabe mais ou menos','Não sabe'],extra:{id:'canais',type:'multi',l:'De onde vem a maior parte? Pode marcar mais de uma.',o:['Indicação de alunos','Instagram','Google','Passou na frente da academia','Panfletagem','Influenciador ou parceiro local','Eventos','Gympass (Wellhub)','TotalPass','Promoção ou campanha de preço'],outro:{id:'canaisOutro',l:'Outro canal',ph:'Ex.: rádio, carro de som, convênio com empresa'},show:function(a){return a.origem==='Sabe para cada aluno'||a.origem==='Sabe mais ou menos'}}},
    {id:'percebe',k:'Evasão',t:'Quando um aluno para de vir, quando vocês percebem?',type:'one',o:['Na mesma semana','No fim do mês','Só quando cancela ou para de pagar']},
    {id:'motivo',k:'Evasão',t:'Pelo que vocês sabem, por que os alunos saem?',hint:'Pode marcar mais de uma.',type:'multi',o:['Preço','Mudou de horário ou rotina','Não viu resultado','Foi para outra academia','Lesão ou saúde','Mudou de bairro ou cidade','Não sabe']},
    {id:'balcao',k:'Pagamento',t:'Quantos alunos pagam mês a mês no balcão, por PIX ou dinheiro?',type:'one',o:['Quase todos','Mais ou menos metade','Poucos','Quase nenhum','Não sabe']},
    {id:'aperta',k:'Pagamento',t:'Quando o caixa aperta, o que vocês fazem?',hint:'Pode marcar mais de uma.',type:'multi',o:['Promoção ou desconto','Cobram quem está devendo','Ação de indicação','Corta custos','Nada específico']},
    // Bloco de marketing (Girassol Digital): só para quem decide (dono/gerente) ou cargo não informado.
    {id:'mkQuem',k:'Marketing',when:decide,t:'Quem cuida do Instagram e dos anúncios da academia?',type:'one',o:['O próprio dono','Um funcionário ou professor','Agência ou freelancer','Ninguém cuida hoje']},
    {id:'mkInvest',k:'Marketing',when:decide,t:'Quanto investem por mês em anúncios pagos?',hint:'Instagram, Facebook, Google.',type:'one',o:['Nada','Até R$ 300','De R$ 301 a R$ 1.000','Mais de R$ 1.000','Não sabe']},
    {id:'mkDor',k:'Marketing',when:decide,t:'No marketing, o que é mais difícil hoje?',hint:'Pode marcar mais de uma.',type:'multi',o:['Atrair gente nova','Transformar seguidor em matrícula','Postar com constância','Saber se o anúncio deu resultado','Não tem tempo para isso']},
    {id:'medo',k:'Trocar de sistema',t:'Se fossem trocar de sistema, o que mais preocuparia?',hint:'Pode marcar mais de uma.',type:'multi',o:['Perder o histórico dos alunos','Bagunçar a recepção','A equipe não se adaptar','Pagar e o sistema não entregar','Contrato com o sistema atual','Não pensa em trocar']},
    {id:'trocaria',k:'Trocar de sistema',t:'O que faria vocês trocarem de sistema amanhã?',hint:'Pode marcar mais de uma.',type:'multi',o:['Pagar menos','Saber antes quem vai sair','Cobrança automática dos alunos','Migrar sem perder o histórico','Suporte que responde rápido','Nada, estão satisfeitos'],extra:{id:'trocariaOutro',l:'Outro motivo, nas palavras da pessoa',ph:'Ex.: relatório simples no celular',show:function(){return true}}},
    {id:'res',type:'res'},
    {id:'contato',k:'Para finalizar',t:'Posso te mandar o diagnóstico completo da sua academia?',hint:'Eu envio pelo WhatsApp ou pelo e-mail, e a gente continua a conversa por lá.',type:'form',fields:[
      {id:'whats',l:'WhatsApp',ph:'(81) 9 0000-0000',tp:'tel'},
      {id:'email',l:'E-mail',ph:'nome@academia.com.br',tp:'email'}],consent:true},
    {id:'obrigado',type:'thanks'},
    {id:'frase',priv:true,k:'Anote do jeito que falou',t:'A frase mais marcante da conversa',hint:'Escreva com as palavras exatas da pessoa. É isso que vira mensagem depois.',type:'area',ph:'"..."'},
    {id:'acao',priv:true,k:'Sinal de interesse',t:'Como a pessoa reagiu?',hint:'Falar em testar, em preço ou em quando começar vale mais do que só reclamar.',type:'one',o:['Quer testar','Pediu preço ou condição','Quer conversar depois','Ficou indiferente','Não demonstrou interesse']},
    {id:'fim',type:'end'}
  ];

  var mode='home', idx=0, cur=null;
  function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstElementChild}
  var tt0;
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt0);tt0=setTimeout(function(){t.classList.remove('on')},2400)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function money(v){var n=parseFloat(String(v||'').replace(/\./g,'').replace(',','.'));return isNaN(n)?null:n}
  function brl(n){return 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function dt(iso){try{return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}

  // Rascunho: a entrevista em andamento é gravada a cada resposta,
  // para não perder nada se o app fechar, a bateria acabar ou a tela travar.
  function saveDraft(){if(cur&&!cur.test&&mode==='step')save(DRAFT,{cur:cur,idx:idx})}
  function clearDraft(){try{localStorage.removeItem(DRAFT)}catch(e){}}
  function setA(k,v){cur.a[k]=v;saveDraft()}

  function decide(a){return !a.cargo||a.cargo==='Dono ou sócio'||a.cargo==='Gerente'}
  function perfil(a){
    if(a.evasao==='Não sabe'||a.controle==='Planilha ou caderno')return 'No escuro';
    if(a.evasao==='Sabe o número exato'&&a.percebe==='Na mesma semana')return 'Já mede, quer agir';
    return 'Com sistema, sem resposta';
  }
  function plano(a){
    var m={'Até 150':'Até 200 alunos, R$ 349 por mês','De 151 a 200':'Até 200 alunos, R$ 349 por mês','De 201 a 600':'Até 600 alunos, R$ 499 por mês','De 601 a 1.000':'Até 1.000 alunos, R$ 699 por mês','Mais de 1.000':'Sob medida'};
    if(a.unidades==='4 ou mais')return 'Sob medida';
    if((a.unidades==='2'||a.unidades==='3')&&a.alunos!=='Mais de 1.000')return 'Até 1.000 alunos, matriz e até 2 filiais, R$ 699 por mês';
    return m[a.alunos]||'A definir';
  }

  function render(){
    var app=document.getElementById('app'); app.innerHTML='';
    var bar=document.querySelector('.bar'); if(bar)bar.remove();
    if(mode==='home')return home(app);
    if(mode==='view')return view(app);
    saveDraft();
    step(app);
  }

  // Botão que pede um 2º toque para confirmar (sem diálogos nativos do navegador).
  function twoTap(btn,msg,fn){btn.onclick=function(){if(btn.dataset.c){fn();return}btn.dataset.c='1';btn.textContent=msg}}

  function home(app){
    var n=all.length, hot=all.filter(function(e){return e.a.acao==='Quer testar'||e.a.acao==='Pediu preço ou condição'}).length;
    var bk=load(BK,null), semBackup=n-(bk?bk.n:0);
    app.appendChild(el('<div class="top"><div class="brand">Controle Fitness<small>Entrevistas na Recife Fitness</small></div><span class="pill ok">Funciona sem internet</span></div>'));
    app.appendChild(el('<div class="card"><div class="row" style="align-items:flex-end"><div style="flex:1"><div class="muted">Entrevistas</div><div class="num">'+n+'</div></div><div style="flex:1"><div class="muted">Querem testar ou pediram preço</div><div class="num" style="color:var(--acc-ink)">'+hot+'</div></div></div></div>'));

    var dr=load(DRAFT,null);
    if(dr&&dr.cur){
      var c=el('<div class="card alert"><b style="color:var(--ink)">Entrevista em andamento</b><p class="muted" style="margin-top:4px">'+esc(dr.cur.a.nome||'Sem nome')+(dr.cur.a.academia?' · '+esc(dr.cur.a.academia):'')+' · começou '+dt(dr.cur.inicio)+'</p><div class="row" style="margin-top:12px"><button class="btn p" id="ret">Retomar</button><button class="btn d" id="des">Descartar</button></div></div>');
      c.querySelector('#ret').onclick=function(){cur=dr.cur;idx=dr.idx||0;mode='step';render();window.scrollTo(0,0)};
      twoTap(c.querySelector('#des'),'Toque de novo',function(){clearDraft();toast('Rascunho descartado');render()});
      app.appendChild(c);
    }

    var go=el('<div class="card" style="padding:0;border:0;background:none"><button class="btn p">Começar nova entrevista</button></div>');
    if(dr&&dr.cur)twoTap(go.querySelector('button'),'Descartar a pausada e começar outra?',function(){start(false)});
    else go.querySelector('button').onclick=function(){start(false)};
    app.appendChild(go);
    var tt=el('<div style="margin-top:8px"><button class="btn g">Fazer uma entrevista de teste (não conta e não fica salva)</button></div>');
    tt.querySelector('button').onclick=function(){start(true)};
    app.appendChild(tt);
    app.appendChild(el('<details class="card tips"><summary>Como abordar no estande</summary><ol>'+
      '<li>Comece pela pessoa, não pelo produto: "Você é o dono ou trabalha na gestão da academia?"</li>'+
      '<li>Peça poucos minutos com uma razão honesta: "Estou fazendo uma pesquisa rápida com donos de academia sobre evasão de alunos. São 3 minutos, e no fim eu te mostro um número sobre a sua academia."</li>'+
      '<li>Segure o celular você mesmo e vá tocando nas respostas enquanto conversa, olhando para a pessoa.</li>'+
      '<li>Não venda durante as perguntas. Se ela perguntar o que você faz, responda em uma frase e diga que conta no fim.</li>'+
      '<li>Quando ela soltar uma frase forte, anote exatamente como falou.</li>'+
      '<li>No resultado, mostre o perfil e quanto cada aluno que sai deixa de pagar em um ano. É aí que você conta do Controle Fitness.</li>'+
      '<li>Só peça o contato com a autorização dela, marcando a caixa de consentimento.</li>'+
      '<li>Prefira os horários mais calmos e os estandes de equipamentos, onde os donos param mais tempo.</li></ol></details>'));
    if(n){
      var l=el('<div class="card list"><h3 style="font-size:16px;margin-bottom:6px">Feitas até agora</h3></div>');
      all.slice().reverse().forEach(function(e){
        var it=el('<div class="it" style="cursor:pointer"><div><b>'+esc(e.a.nome||'Sem nome')+'</b><small>'+esc(e.a.academia||'')+' · '+esc(e.perfil||'')+' · '+esc(e.a.acao||'')+'</small></div><small style="white-space:nowrap">'+dt(e.fim||e.inicio)+'</small></div>');
        it.onclick=function(){cur=e;mode='view';render();window.scrollTo(0,0)};
        l.appendChild(it);
      });
      app.appendChild(l);
    }
    var ex=el('<div class="card"><h3 style="font-size:16px">Cópia de segurança</h3>'+
      (n?'<p class="muted" style="margin-top:6px">'+(semBackup>0?'<b style="color:var(--warn)">'+semBackup+' entrevista(s) ainda só neste celular.</b> ':'Tudo copiado. ')+(bk?'Último backup: '+dt(bk.em)+'.':'Nenhum backup feito ainda.')+'</p>':'<p class="muted" style="margin-top:6px">Os dados ficam guardados neste celular, mesmo sem internet. Ao fim de cada dia, mande o backup para o seu WhatsApp, e-mail ou Drive.</p>')+
      '<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">'+
      (n?'<button class="btn p" id="bkp">Enviar backup completo</button><div class="row"><button class="btn s" id="csv">Planilha</button><button class="btn s" id="cp">Copiar texto</button></div>':'')+
      '<button class="btn g" id="rst">Restaurar backup de outro aparelho</button></div></div>');
    if(n){ex.querySelector('#bkp').onclick=exportJson;ex.querySelector('#csv').onclick=exportCsv;ex.querySelector('#cp').onclick=copyAll}
    ex.querySelector('#rst').onclick=function(){document.getElementById('restore').click()};
    app.appendChild(ex);
  }

  function step(app){
    var q=Q[idx], total=Q.length-1, a=cur.a;
    var perg=Q.filter(function(x){return x.k&&!x.priv&&x.id!=='contato'&&vis(x)}), nq=perg.length;
    var lab={res:'Resultado para mostrar à pessoa',thanks:'Fim da conversa',end:'Salvar'}[q.type]||(q.priv?'Só para você':(q.id==='contato'?'Para finalizar':'Pergunta '+(perg.indexOf(q)+1)+' de '+nq));
    app.appendChild(el('<div class="top"><div class="brand">Entrevista<small>'+lab+'</small></div><button class="pill" id="sair" style="cursor:pointer">'+(cur.test?'Sair':'Pausar')+'</button></div>'));
    app.querySelector('#sair').onclick=function(){
      if(!cur.test&&Object.keys(a).length){saveDraft();toast('Entrevista pausada. Retome na tela inicial')}
      else if(!cur.test)clearDraft();
      cur=null;mode='home';render();window.scrollTo(0,0);
    };
    if(cur.test)app.appendChild(el('<div class="testbar">Modo teste. Nada desta entrevista será salvo.</div>'));
    app.appendChild(el('<div class="prog"><span style="width:'+Math.round(idx/total*100)+'%"></span></div>'));
    if(q.priv)app.appendChild(el('<div class="testbar" style="background:#E0F2FE;color:#075985">Só para você. Preencha depois que a pessoa sair.</div>'));
    if(q.type==='res')return result(app);
    if(q.type==='thanks')return thanks(app);
    if(q.type==='end')return finish(app);
    var c=el('<div class="step"><div class="k">'+q.k+'</div><h2>'+q.t+'</h2>'+(q.hint?'<p class="hint">'+q.hint+'</p>':'')+'</div>');
    if(q.type==='one'||q.type==='multi'){
      var box=el('<div class="opts"></div>');
      q.o.forEach(function(o){
        var on=q.type==='multi'?(a[q.id]||[]).indexOf(o)>-1:a[q.id]===o;
        var b=el('<button class="opt'+(q.type==='multi'?' multi':'')+(on?' on':'')+'"><i></i><span>'+o+'</span></button>');
        b.onclick=function(){
          if(q.type==='multi'){var arr=a[q.id]||[];var i=arr.indexOf(o);if(i>-1)arr.splice(i,1);else arr.push(o);setA(q.id,arr);var y=window.scrollY;render();window.scrollTo(0,y)}
          else{setA(q.id,o); if(q.extra&&q.extra.show(a)){render()}else{next()}}
        };
        box.appendChild(b);
      });
      c.appendChild(box);
      if(q.extra&&q.extra.show(a)&&q.extra.type==='multi'){
        c.appendChild(el('<label class="f" style="margin-top:22px">'+q.extra.l+'</label>'));
        var bx=el('<div class="opts" style="margin-top:10px"></div>');
        q.extra.o.forEach(function(o){
          var on=(a[q.extra.id]||[]).indexOf(o)>-1;
          var b=el('<button class="opt multi'+(on?' on':'')+'"><i></i><span>'+o+'</span></button>');
          b.onclick=function(){var arr=a[q.extra.id]||[];var i=arr.indexOf(o);if(i>-1)arr.splice(i,1);else arr.push(o);setA(q.extra.id,arr);var y=window.scrollY;render();window.scrollTo(0,y)};
          bx.appendChild(b);
        });
        c.appendChild(bx);
        var fo=el('<div><label class="f">'+q.extra.outro.l+'</label><input class="t" value="'+esc(a[q.extra.outro.id]||'')+'" placeholder="'+q.extra.outro.ph+'"></div>');
        fo.querySelector('input').oninput=function(e){setA(q.extra.outro.id,e.target.value)};
        c.appendChild(fo);
      } else if(q.extra&&q.extra.show(a)){
        var f=el('<div><label class="f">'+q.extra.l+'</label><input class="t" value="'+esc(a[q.extra.id]||'')+'" placeholder="'+q.extra.ph+'"></div>');
        f.querySelector('input').oninput=function(e){setA(q.extra.id,e.target.value)};
        c.appendChild(f);
      }
    } else if(q.type==='form'){
      q.fields.forEach(function(fd){
        var f=el('<div><label class="f">'+fd.l+'</label><input class="t" '+(fd.num?'inputmode="decimal" ':'')+'type="'+(fd.tp||'text')+'" value="'+esc(a[fd.id]||'')+'" placeholder="'+fd.ph+'"></div>');
        f.querySelector('input').oninput=function(e){setA(fd.id,e.target.value)};
        c.appendChild(f);
      });
      if(q.consent){
        var cs=el('<label class="consent"><input type="checkbox" '+(a.consent?'checked':'')+'><span>A pessoa autorizou o Controle Fitness a guardar estes dados e a enviar o diagnóstico e continuar a conversa por WhatsApp e e-mail.</span></label>');
        cs.querySelector('input').onchange=function(e){setA('consent',e.target.checked)};
        c.appendChild(cs);
        c.appendChild(el('<p class="muted" style="margin-top:8px">Se a pessoa não quiser, deixe em branco e toque em Continuar. A entrevista é salva do mesmo jeito.</p>'));
      }
    } else if(q.type==='text'){
      var f1=el('<div><input class="t" value="'+esc(a[q.id]||'')+'" placeholder="'+q.ph+'" style="margin-top:18px"></div>');
      f1.querySelector('input').oninput=function(e){setA(q.id,e.target.value)};
      c.appendChild(f1);
    } else if(q.type==='area'){
      var f2=el('<div><textarea class="t" placeholder="'+q.ph+'" style="margin-top:18px">'+esc(a[q.id]||'')+'</textarea></div>');
      f2.querySelector('textarea').oninput=function(e){setA(q.id,e.target.value)};
      c.appendChild(f2);
    }
    app.appendChild(c);
    var bar=el('<div class="bar"><div class="in row"><button class="btn s" id="back" style="flex:0 0 34%">Voltar</button><button class="btn p" id="nx">'+((q.type==='one'||q.type==='multi')&&!(a[q.id]&&a[q.id].length)?'Pular':'Continuar')+'</button></div></div>');
    bar.querySelector('#back').disabled=idx===0;
    bar.querySelector('#back').onclick=back;
    bar.querySelector('#nx').onclick=function(){
      if(q.consent&&(a.whats||a.email)&&!a.consent){toast('Marque a autorização antes de salvar o contato');return}
      next();
    };
    document.body.appendChild(bar);
  }
  // Perguntas condicionais (when) são puladas para frente e para trás.
  function vis(q){return !q.when||q.when(cur.a)}
  function next(){idx++;while(idx<Q.length-1&&!vis(Q[idx]))idx++;render();window.scrollTo(0,0)}
  function back(){if(idx<=0)return;idx--;while(idx>0&&!vis(Q[idx]))idx--;render();window.scrollTo(0,0)}
  function start(test){cur={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),inicio:new Date().toISOString(),a:{},test:!!test};idx=0;mode='step';render();window.scrollTo(0,0)}

  function result(app){
    var a=cur.a, p=perfil(a), t=money(a.ticket), mn=money(a.planoMin), m=t||mn;
    cur.perfil=p; cur.plano=plano(a); saveDraft();
    var txt={'No escuro':'A academia ainda não sabe quantos alunos perde nem de onde eles vêm. As decisões de preço e de promoção acontecem sem esse número.',
      'Com sistema, sem resposta':'Existe um sistema, mas ele não responde por que o aluno sai nem avisa a tempo. O aluno some e a academia percebe tarde.',
      'Já mede, quer agir':'A academia acompanha os números. O próximo passo é agir antes de o aluno sair, com a lista de quem recuperar a cada dia.'}[p];
    var r=el('<div class="card res"><div class="muted">O perfil da academia</div><div class="big">'+p+'</div><p>'+txt+'</p>'+
      (m?'<div class="muted" style="margin-top:16px">Cada aluno que vai embora deixa de pagar, em um ano, pelo menos</div><div class="money">'+brl(m*12)+'</div><p class="muted">Calculado com '+(t?'o ticket médio informado':'o valor do plano mais barato')+', de '+brl(m)+' por mês.</p>':'')+
      '<p style="margin-top:16px"><b>Perguntas que o sistema da academia deveria responder:</b></p><ul><li>Quantos alunos saíram no mês passado e em quais meses mais saem.</li><li>De onde vem cada aluno e quanto tempo fica quem veio de promoção.</li><li>Quem está prestes a sair hoje, e por qual motivo.</li></ul>'+
      '<p class="muted" style="margin-top:14px">Plano do Controle Fitness para este tamanho: <b>'+esc(cur.plano)+'</b>. Teste de 14 dias com a plataforma completa.</p></div>');
    app.appendChild(r);
    navBar('Continuar',function(){next()});
  }
  function thanks(app){
    var nm=cur.a.nome?', '+esc(cur.a.nome.split(' ')[0]):'';
    app.appendChild(el('<div class="card res" style="text-align:center;padding:36px 20px"><div class="big" style="font-size:30px">Obrigado pela sua colaboração'+nm+'!</div><p style="margin-top:14px">'+(cur.a.consent?'O diagnóstico completo chega no seu WhatsApp ou e-mail.':'Foi ótimo conversar com você.')+'</p><p class="muted" style="margin-top:22px">Mostre esta tela para a pessoa. Depois que ela sair, toque em continuar.</p></div>'));
    navBar('A pessoa já saiu',function(){next()});
  }
  function finish(app){
    var a=cur.a;
    app.appendChild(el('<div class="card res"><div class="muted">Pronto para salvar</div><div class="big" style="font-size:22px">'+esc(a.nome||'Sem nome')+(a.academia?' · '+esc(a.academia):'')+'</div><p>'+esc(cur.perfil||'')+' · '+esc(a.acao||'Reação não marcada')+'</p><p class="muted">'+(a.consent?'Autorizou o envio do diagnóstico.':'Sem contato autorizado.')+'</p></div>'));
    navBar(cur.test?'Encerrar teste':'Salvar entrevista',function(){
      if(cur.test){cur=null;toast('Teste encerrado. Nada foi salvo');mode='home';render();window.scrollTo(0,0);return}
      cur.fim=new Date().toISOString();
      if(!a.consent){delete a.whats;delete a.email} else if(!cur.consentEm){cur.consentEm=cur.fim}
      Q.forEach(function(q){if(!vis(q))delete a[q.id]}); // ex.: mudou o cargo depois de responder o marketing
      delete cur.test;
      var i=all.findIndex(function(e){return e.id===cur.id}); if(i>-1)all[i]=cur; else all.push(cur);
      if(!persist())return; // memória cheia: mantém o rascunho e a tela
      clearDraft(); cur=null; toast('Entrevista salva no celular');
      mode='home';render();window.scrollTo(0,0);
    });
  }
  function navBar(label,fn){
    var bar=el('<div class="bar"><div class="in row"><button class="btn s" id="back" style="flex:0 0 34%">Voltar</button><button class="btn p" id="sv">'+label+'</button></div></div>');
    bar.querySelector('#back').onclick=back;
    bar.querySelector('#sv').onclick=fn;
    document.body.appendChild(bar);
  }

  function view(app){
    var e=cur,a=e.a;
    app.appendChild(el('<div class="top"><div class="brand">'+esc(a.nome||'Sem nome')+'<small>'+esc(a.academia||'')+'</small></div><button class="pill" id="v" style="cursor:pointer">Voltar</button></div>'));
    app.querySelector('#v').onclick=function(){cur=null;mode='home';render()};
    var rows=[['Perfil',e.perfil],['Plano',e.plano]];
    Q.forEach(function(q){
      if(q.type==='form'){q.fields.forEach(function(f){rows.push([f.l,a[f.id]])})}
      else if(q.k){rows.push([q.t,Array.isArray(a[q.id])?a[q.id].join(', '):a[q.id]]); if(q.extra){rows.push([q.extra.l,Array.isArray(a[q.extra.id])?a[q.extra.id].join(', '):a[q.extra.id]]); if(q.extra.outro)rows.push([q.extra.outro.l,a[q.extra.outro.id]])}}
    });
    rows.push(['Autorizou contato',a.consent?'Sim':'Não']);
    var c=el('<div class="card list"></div>');
    rows.forEach(function(r){if(r[1])c.appendChild(el('<div class="it" style="display:block"><small>'+esc(r[0])+'</small><b>'+esc(r[1])+'</b></div>'))});
    app.appendChild(c);
    var ed=el('<div class="card" style="padding:0;border:0;background:none;display:flex;flex-direction:column;gap:10px"><button class="btn s" id="ed">Editar respostas</button><button class="btn d" id="rm">Excluir entrevista</button></div>');
    // edita uma CÓPIA: só substitui a salva ao tocar em "Salvar entrevista"
    ed.querySelector('#ed').onclick=function(){cur=JSON.parse(JSON.stringify(e));idx=0;mode='step';render();window.scrollTo(0,0)};
    twoTap(ed.querySelector('#rm'),'Toque de novo para excluir',function(){all=all.filter(function(x){return x.id!==e.id});persist();cur=null;mode='home';toast('Entrevista excluída');render()});
    app.appendChild(ed);
  }

  // ---------- Exportação e backup ----------
  var COLS=[['id','id'],['inicio','Início'],['fim','Fim'],['perfil','Perfil'],['plano','Plano']];
  Q.forEach(function(q){if(q.type==='form')q.fields.forEach(function(f){COLS.push(['a.'+f.id,f.l])}); else if(q.k){COLS.push(['a.'+q.id,q.t]); if(q.extra){COLS.push(['a.'+q.extra.id,q.extra.l]); if(q.extra.outro)COLS.push(['a.'+q.extra.outro.id,q.extra.outro.l])}}});
  COLS.push(['a.consent','Autorizou contato']);COLS.push(['consentEm','Data do consentimento']);
  function val(e,k){var v=k.indexOf('a.')===0?e.a[k.slice(2)]:e[k]; if(Array.isArray(v))v=v.join(' | '); if(v===true)v='Sim'; if(v===false||v==null)v=''; return String(v)}
  function csv(){return [COLS.map(function(c){return c[1]})].concat(all.map(function(e){return COLS.map(function(c){return val(e,c[0])})})).map(function(r){return r.map(function(x){return '"'+x.replace(/"/g,'""')+'"'}).join(';')}).join('\r\n')}
  function stamp(){var d=new Date();function p(n){return String(n).padStart(2,'0')}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+'h'+p(d.getMinutes())}
  function markBackup(){save(BK,{em:new Date().toISOString(),n:all.length});if(mode==='home')render()}

  // Compartilha o arquivo (WhatsApp, e-mail, Drive…) quando o celular permite; senão baixa.
  function shareFile(name,data,type){
    var blob=new Blob([data],{type:type});
    var file=null; try{file=new File([blob],name,{type:type})}catch(e){}
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:name}).then(function(){markBackup();toast('Arquivo enviado')}).catch(function(err){
        if(err&&err.name==='AbortError'){toast('Envio cancelado');return}
        download(name,blob);
      });
    } else download(name,blob);
  }
  function download(name,blob){
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},4000);
    markBackup();toast('Arquivo salvo em Downloads');
  }
  function exportJson(){shareFile('backup-entrevistas_'+stamp()+'.txt',JSON.stringify({app:'entrevistas-recife-fitness',versao:1,exportadoEm:new Date().toISOString(),entrevistas:all},null,1),'text/plain')} // .txt: o Android não compartilha .json
  function exportCsv(){shareFile('entrevistas-recife-fitness_'+stamp()+'.csv','﻿'+csv(),'text/csv')}
  function copyAll(){
    var txt=all.map(function(e){return COLS.map(function(c){var v=val(e,c[0]);return v?c[1]+': '+v:''}).filter(Boolean).join('\n')}).join('\n\n----------\n\n');
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){toast('Copiado. Cole no seu WhatsApp ou e-mail')},function(){toast('Não foi possível copiar')})}
    else toast('Não foi possível copiar');
  }
  document.getElementById('restore').onchange=function(ev){
    var f=ev.target.files&&ev.target.files[0]; ev.target.value=''; if(!f)return;
    f.text().then(function(txt){
      var j=JSON.parse(txt), list=Array.isArray(j)?j:j.entrevistas;
      if(!Array.isArray(list))throw new Error('formato');
      var novas=0,atual=0;
      list.forEach(function(e){
        if(!e||!e.id||!e.a)return;
        var i=all.findIndex(function(x){return x.id===e.id});
        if(i<0){all.push(e);novas++}
        else if((e.fim||'')>(all[i].fim||'')){all[i]=e;atual++}
      });
      all.sort(function(x,y){return (x.inicio||'')<(y.inicio||'')?-1:1});
      persist();render();toast(novas+' nova(s), '+atual+' atualizada(s)');
    }).catch(function(){toast('Arquivo inválido. Use o arquivo de backup gerado pelo app')});
  };

  // ---------- Offline / atualização ----------
  if('serviceWorker' in navigator){
    var reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(window.__querAtualizar&&!reloading){reloading=true;location.reload()}});
    navigator.serviceWorker.register('sw.js').then(function(reg){
      function offer(w){
        if(!w||!navigator.serviceWorker.controller||document.querySelector('.update'))return;
        var b=el('<button class="update">Nova versão disponível. Tocar para atualizar</button>');
        b.onclick=function(){saveDraft();window.__querAtualizar=true;w.postMessage('skipWaiting')};
        document.body.appendChild(b);
      }
      if(reg.waiting)offer(reg.waiting);
      reg.addEventListener('updatefound',function(){var w=reg.installing;w&&w.addEventListener('statechange',function(){if(w.state==='installed')offer(w)})});
    }).catch(function(){});
  }

  window.__entrevistas={debug:function(){return {mode:mode,idx:idx,n:all.length,draft:load(DRAFT,null)}}};
  render();
})();

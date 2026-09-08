(() => {
  'use strict';
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const owns = (player,item) => { const map = item.type === 'badge' ? player.items?.unlockedBadges : player.unlockedImages; return record(map) && Object.hasOwn(map,item.id) && !!map[item.id]; };
  window.CJShop = Object.freeze({
    async buy(id) {
      const item = CJShopConfig.items.find(item => item.id === id);
      if (!item) return {ok:false,code:'invalid'};
      return CJV2AccountTransactions.update((player,api) => {
        if (owns(player,item)) return {ok:true,changed:false,code:'owned'};
        if (!item.available) return {ok:false,code:'unavailable'};
        const balance = player.stats?.totalCJ, price = item.priceCJ;
        if (!Number.isFinite(balance) || balance < 0 || !Number.isSafeInteger(price) || price <= 0 || typeof api.spendCJ !== 'function') return {ok:false,code:'account'};
        if (balance < price) return {ok:false,code:'funds'};
        if (item.type === 'badge' ? (player.items !== undefined && !record(player.items)) || (player.items?.unlockedBadges !== undefined && !record(player.items.unlockedBadges)) : player.unlockedImages !== undefined && !record(player.unlockedImages)) return {ok:false,code:'invalid'};
        let staged = false;
        if (!api.spendCJ.call({ensureDataStructure:()=>player,savePlayer:value=>{staged=value===player;}},price) || !staged || player.stats.totalCJ !== balance-price) return {ok:false,code:'account'};
        if (item.type === 'badge') player.items = {...player.items,unlockedBadges:{...player.items?.unlockedBadges,[id]:{unlockedAt:Date.now(),priceCJ:price,source:'shop-v2'}}};
        else player.unlockedImages = {...player.unlockedImages,[id]:true};
        return {ok:true,changed:true,code:'purchased',price};
      });
    }
  });
  const grid = document.getElementById('shop-grid'), status = document.getElementById('shop-status');
  const el = (tag,cls,text) => {const n=document.createElement(tag);n.className=cls || '';if(text !== undefined)n.textContent=text;return n;};
  const messages = {owned:'Déjà possédé · Aucun CJ débité.',funds:'Solde CJ insuffisant.',unavailable:'Ce badge sera disponible lors de son événement.',account:'Ton compte CJ doit être disponible pour acheter.',invalid:'Données illisibles : aucun achat effectué.',storage:'Sauvegarde non confirmée. Recharge la page avant de réessayer.',busy:'Une opération est en cours. Réessaie dans quelques instants.',conflict:'Le compte a changé. Réessaie.',unsupported:'Les achats nécessitent une connexion HTTPS ou localhost et un navigateur récent.'};
  let category='avatar', busy=false;
  function render() {
    const profile=CJDashboardProfile.read();
    let player;try{player=CJajlkAccount.getPlayer() || {};}catch{player={};}
    document.getElementById('shop-balance').textContent=profile.balance ?? '—';
    const note=document.getElementById('shop-notice');note.textContent=profile.state !== 'ready' || profile.balance === null ? messages.account : !CJV2AccountTransactions.supported ? messages.unsupported : '';
    const focusId=document.activeElement?.closest('[data-shop-item]')?.dataset.shopItem;
    grid.replaceChildren();
    document.querySelectorAll('[data-shop-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shopCategory===category)));
    if(category==='collections') {
      const data=window.CJCollections?.read(), card=el('article','panel shop-collection');
      card.append(el('span','shop-symbol','✧'),el('h2','','Un univers, morceau par morceau'),el('p','subtle','Complète les illustrations pour obtenir leurs fonds de profil.'));
      if(data?.state==='ready')card.append(el('p','',`${data.cards.reduce((n,c)=>n+c.count,0)}/12 morceaux acquis · ${data.cards.filter(c=>c.count===4).length}/3 Collections complètes`));
      card.append(el('p','','2 CJ par morceau · 8 CJ par Collection'));
      const link=el('a','button','Explorer les Collections');link.href='#collections';card.append(link);grid.append(card);return;
    }
    const items=category==='background' ? (profile.cosmetics || []).filter(item=>item.type==='background') : CJShopConfig.items.filter(item=>item.type===category);
    if(!items.length){const card=el('article','panel shop-collection');card.append(el('h2','','Bientôt disponible'),el('p','subtle','Tes fonds débloqués apparaîtront ici. Complète une Collection pour obtenir ton premier fond.'));const link=el('a','button','Découvrir les Collections');link.href='#collections';card.append(link);grid.append(card);}
    for(const item of items){
      const owned=category==='background' || owns(player,item), equipped=(item.type==='badge'?profile.selected:profile[item.type]?.id)===item.id;
      const card=el('article','panel shop-item');card.dataset.shopItem=item.id;
      const preview=el('div',`shop-preview shop-preview-${item.type}`);
      if(item.src){const img=el('img');img.src=item.src;img.alt='';preview.append(img);}else preview.append(el('span','shop-symbol',item.label.split(' ')[0]));
      card.append(preview,el('span','shop-ownership',equipped?'✓ Équipé':owned?'✓ Possédé':'Non possédé'),el('h2','',item.label),el('p','subtle',item.type==='background'?'Fond définitivement acquis':item.type==='badge'?'Badge / titre de ta Carte Joueur':'Avatar de ta Carte Joueur'));
      const button=el('button','button',busy?'Un instant…':owned?(equipped?'Déséquiper':'Équiper'):!item.available?'Bientôt disponible':`Acheter · ${item.priceCJ} CJ`);button.type='button';
      button.disabled=busy || (!owned && (!item.available || profile.state!=='ready' || profile.balance===null || profile.balance<item.priceCJ || !CJV2AccountTransactions.supported));
      button.addEventListener('click',async event=>{if(busy || event.detail>1)return;busy=true;render();try{if(owned){const ok=await CJDashboardProfile.equip(item.type,equipped?null:item.id);status.textContent=ok?(equipped?'Déséquipé · Toujours possédé.':`${item.label} équipé.`):messages.storage;}else{const result=await CJShop.buy(item.id);status.textContent=result.code==='purchased'?`${item.label} acquis pour ${result.price} CJ. Tu peux maintenant l’équiper.`:messages[result.code] || messages.storage;}}catch{status.textContent=messages.storage;}finally{setTimeout(()=>{busy=false;render();},600);render();}});
      card.append(button);
      if(!owned && !item.available)card.append(el('p','subtle',`Événement de Pâques · ${item.priceCJ} CJ`));
      else if(!owned && profile.balance!==null && profile.balance<item.priceCJ)card.append(el('p','subtle',`Il te manque ${item.priceCJ-profile.balance} CJ.`));
      grid.append(card);
    }
    if(focusId)grid.querySelector(`[data-shop-item="${focusId}"] button`)?.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-shop-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.shopCategory;status.textContent='';render();}));
  window.addEventListener('storage',event=>{if(!event.key || event.key==='cjPlayerData')render();});
  for(const event of ['cj-account-updated','pageshow','focus','hashchange','cj-profile-catalog'])window.addEventListener(event,render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  render();
})();

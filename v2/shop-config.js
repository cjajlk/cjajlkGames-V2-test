/* Existing universal-CJ prices from assets/js/cjShop.js. */
(() => {
  const avatars = [['breaker_mascotte_1',20],['breaker_mascotte_2',20],['breaker_mascotte_3',20],['attrape_mascotte_1',15],['attrape_mascotte_2',15]].map(([id,priceCJ]) => ({...CJProfileCatalog.entries.find(item => item.id === id), priceCJ, available:true}));
  const badges = [['explorer',10],['fidele',25],['centre',50],['paques',30]].map(([id,priceCJ]) => ({id,type:'badge',label:CJProfileCatalog.badge(id),priceCJ,available:id !== 'paques'}));
  window.CJShopConfig = Object.freeze({items:Object.freeze([...avatars,...badges].map(Object.freeze))});
})();

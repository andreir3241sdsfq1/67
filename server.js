// ═══════════════════════════════════════════════════════════════
// 🔒 SERVER CONFIGURATION - BUNDLE MESSENGER
// ═══════════════════════════════════════════════════════════════
// Этот файл содержит все секретные ключи и конфигурацию
// Хранится на GitHub и подгружается клиентом

(function() {
  // Конфигурация Supabase (НОВЫЕ ДАННЫЕ)
  const SUPABASE_URL = 'https://fpfxskklektfnbftpafm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_sfbWRnsUpww-w8cnRBsdHg_RvCl6Bib';
  const STORAGE_BUCKET = 'bundle-images';
  
  // EmailJS конфигурация (замени на свои данные)
  const EMAILJS_PUBLIC_KEY  = 'ВСТАВЬ_PУБЛИЧНЫЙ_КЛЮЧ_EMAILJS';
  const EMAILJS_SERVICE_ID  = 'ВСТАВЬ_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'ВСТАВЬ_TEMPLATE_ID';
  
  // Admin credentials (НЕ МЕНЯТЬ!)
  const ADMIN_NICK_LOWER  = 'neked';
  const ADMIN_USERNAME    = 'neked';
  
  // Функция для инициализации всех глобальных переменных
  window.initBundle = function() {
    // Проксируем все переменные в window
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_KEY = SUPABASE_KEY;
    window.STORAGE_BUCKET = STORAGE_BUCKET;
    window.EMAILJS_PUBLIC_KEY = EMAILJS_PUBLIC_KEY;
    window.EMAILJS_SERVICE_ID = EMAILJS_SERVICE_ID;
    window.EMAILJS_TEMPLATE_ID = EMAILJS_TEMPLATE_ID;
    window.ADMIN_NICK_LOWER = ADMIN_NICK_LOWER;
    window.ADMIN_USERNAME = ADMIN_USERNAME;
    
    // Инициализация EmailJS
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'ВСТАВЬ_PУБЛИЧНЫЙ_КЛЮЧ_EMAILJS') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    
    // Запускаем основную логику клиента
    if (typeof window.startClient === 'function') {
      window.startClient();
    } else {
      // Если startClient не определён, запускаем авто-логин стандартным способом
      (async()=>{
        const saved=localStorage.getItem('bundle-user');
        if(saved){
          try{
            const local=JSON.parse(saved);
            const H={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'};
            const fresh=await fetch(`${SUPABASE_URL}/rest/v1/bundle_users?select=id,nickname,username,avatar,muted_until,email,password_hash&id=eq.${local.id}`,{headers:H}).then(r=>r.json());
            if(fresh&&fresh.length>0){
              if(!fresh[0].password_hash&&!isAdmin(fresh[0].nickname)&&!isAdminUser(fresh[0].username)){
                localStorage.removeItem('bundle-user');
                document.body.classList.remove('checking');
                document.getElementById('authScreen').classList.add('active');
                showToast('Обновление: пожалуйста, зарегистрируйся заново',6000);
                return;
              }
              window.me={...fresh[0],sessionToken:local.sessionToken||btoa(local.id+':'+Date.now())};
              if(isAdmin(window.me.nickname)) {
                const ap = sessionStorage.getItem('_ap');
                if(ap) window.me._adminPass = ap;
              }
              localStorage.setItem('bundle-user',JSON.stringify(window.me));
              await fetch(`${SUPABASE_URL}/rest/v1/bundle_users?id=eq.${window.me.id}`,{method:'PATCH',headers:H,body:JSON.stringify({last_seen:new Date().toISOString()})});
              document.body.classList.remove('checking');
              if(typeof window.enterChat === 'function') window.enterChat();
              else console.error('enterChat not defined');
            } else {
              localStorage.removeItem('bundle-user');
              document.body.classList.remove('checking');
              document.getElementById('authScreen').classList.add('active');
            }
          }catch(e){
            console.error(e);localStorage.removeItem('bundle-user');
            document.body.classList.remove('checking');
            document.getElementById('authScreen').classList.add('active');
          }
        } else {
          document.body.classList.remove('checking');
          document.getElementById('authScreen').classList.add('active');
        }
      })();
    }
  };
  
  // Вспомогательные функции, которые могут понадобиться клиенту
  window.isAdmin = (nick) => (nick||'').trim().toLowerCase() === ADMIN_NICK_LOWER;
  window.isAdminUser = (u) => (u||'').trim().toLowerCase() === ADMIN_USERNAME;
  window.hashP = (p) => btoa(unescape(encodeURIComponent(p)));
  window.genCode = () => String(Math.floor(10000+Math.random()*90000));
  
  // Проксируем DB функции, чтобы они использовали правильные ключи
  window.dbQ = async function(table, p={}) {
    let url=`${SUPABASE_URL}/rest/v1/${table}?`;
    if(p.select) url+=`select=${encodeURIComponent(p.select)}&`;
    if(p.order)  url+=`order=${p.order}&`;
    if(p.limit)  url+=`limit=${p.limit}&`;
    if(p.filter) url+=p.filter+'&';
    const r=await fetch(url,{headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'}});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  };
  
  window.dbI = async function(table,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:'POST',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  };
  
  window.dbP = async function(table,filter,data) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`,{method:'PATCH',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  };
  
  window.dbD = async function(table,filter) {
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`,{method:'DELETE',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'}});
    if(!r.ok) throw new Error(await r.text());
  };
  
  window.uploadImg = async function(file) {
    const ext=file.name.split('.').pop().toLowerCase()||'jpg';
    const name=`img_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${name}`,{
      method:'POST',
      headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':file.type,'x-upsert':'true'},
      body:file
    });
    if(!r.ok) throw new Error(await r.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${name}`;
  };
  
  window.sendOtp = async function(email,code,name){
    if(EMAILJS_PUBLIC_KEY==='ВСТАВЬ_PУБЛИЧНЫЙ_КЛЮЧ_EMAILJS'){
      showToast(`📧 DEV режим: код ${code}`,12000);
      return;
    }
    if (typeof emailjs !== 'undefined') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{to_email:email,code,user_name:name||email});
    } else {
      console.warn('EmailJS not loaded');
      showToast(`📧 Код подтверждения: ${code}`,10000);
    }
  };
  
  console.log('✅ Bundle server config loaded');
})();

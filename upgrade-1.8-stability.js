/* QUEST DAY 1.8 — account protection, optional recovery and PWA usability.
   No automatic collection of email. Email/password are used only with Supabase Auth
   when the user explicitly requests account linking or sign-in.
   Local quests, gold, characters, backups are NEVER uploaded by this feature. */
(function(){
  "use strict";
  const bridge=window.QuestDayRealtime;
  const settings=document.getElementById("settings");
  if(!bridge||!settings)return;
  const HOLD_KEY="qd18-remote-profile-sync-hold-v1";
  const css=document.createElement("style");
  css.textContent=[
    ".qd18-panel{background:#fff;border:1px solid #e8e6f2;border-radius:18px;padding:17px;margin:16px 0}",
    ".qd18-panel h3{font-size:17px;margin:0 0 9px;color:#4b4375}",
    ".qd18-panel p{font-size:12px;line-height:1.65;color:#8c8ba0;margin:8px 0}",
    ".qd18-panel details{border-top:1px solid #ebe9f2;padding:11px 0}",
    ".qd18-panel summary{font-weight:800;color:#6253b5;font-size:13px;cursor:pointer}",
    ".qd18-panel label{display:block;font-size:12px;font-weight:700;color:#56536e;margin:11px 0 5px}",
    ".qd18-panel input{display:block;width:100%;min-height:44px;padding:10px 12px;border-radius:10px;border:1px solid #deddec;background:#fcfbff;font:inherit;font-size:16px;box-sizing:border-box}",
    ".qd18-panel button{border:0;border-radius:11px;background:#7664df;color:white;min-height:43px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;margin:8px 5px 3px 0}",
    ".qd18-panel button:disabled{opacity:.5;cursor:default}",
    ".qd18-panel .qd18-muted-btn{color:#6757c0;background:#eeebff}",
    ".qd18-state{font-size:12px;padding:12px;background:#f4f1ff;color:#6a5ab2;border-radius:11px;line-height:1.6;margin:12px 0}",
    ".qd18-warning{font-size:12px;padding:12px;background:#fff5eb;color:#8e6950;border-radius:11px;line-height:1.6;margin:12px 0}",
    ".qd18-feedback{font-size:12px;padding:10px;border-radius:10px;margin:10px 0;background:#f0eff8;color:#6c6684;line-height:1.6;white-space:pre-wrap}",
    "@media(max-width:380px){.qd18-panel{padding:13px}}"
  ].join("");
  document.head.appendChild(css);

  const box=document.createElement("section");
  box.id="qd18Protection";box.className="qd18-panel";
  settings.appendChild(box);
  let busy=false,notice="",noticeIsError=false,currentUser=null;
  const safe=text=>escapeHtml(String(text??""));
  function userClient(){return bridge.getClient();}
  function isReady(){return bridge.isReady()&&!!userClient();}
  function status(){
    if(!isReady())return "서버에 자동 연결하고 있어요. 연결이 계속 실패하면 인터넷과 Supabase 설정을 확인해 주세요.";
    if(!currentUser)return "계정 상태를 확인할 수 있어요.";
    if(currentUser.email && currentUser.email_confirmed_at){
      return "이메일 인증 완료: "+currentUser.email+
       " · 다른 기기에서 로그인하려면 비밀번호 설정도 완료해 주세요.";
    }
    if(currentUser.new_email)return "새 이메일 인증 대기 중이에요. 메일함에서 인증을 완료해 주세요.";
    return "현재 익명 QUEST DAY 계정이에요. 이메일 인증 전에는 기기를 바꾸거나 앱 데이터를 삭제하면 계정을 복구할 수 없어요.";
  }
  function render(){
    const locked=bridge.isProfileSyncHeld?.();
    box.innerHTML='<h3>🔐 QUEST DAY 계정 보호</h3>'+
      '<p>현재 QUEST DAY 계정에 이메일과 비밀번호를 연결하면 다른 기기에서 로그인할 수 있어요. '+
      '이메일 연결은 선택 사항이고, 기존 익명 모드도 계속 사용할 수 있어요.</p>'+
      '<div class="qd18-state">'+safe(status())+'</div>'+
      '<div class="qd18-warning">☁️ 위의 <strong>계정 전체 데이터 동기화</strong>를 활성화하면 '+
      '퀘스트·골드·캐릭터까지 계정에 저장되고 다른 기기에서 이어서 사용할 수 있어요. '+
      '이메일 인증과 비밀번호 설정을 완료해야 다른 기기에서 같은 계정으로 로그인할 수 있어요.</div>'+
      (locked?'<div class="qd18-warning">🔒 계정 전환 후 기존 서버 기록을 보호하고 있어요. '+
      '위의 클라우드 동기화 화면에서 기존 기록을 불러오거나 충돌을 해결해 주세요.</div>':"")+
      '<details><summary>1. 현재 QUEST DAY 계정에 이메일 연결 (선택)</summary>'+
      '<p>Supabase에서 Email 로그인을 활성화하고, Authentication 설정의 Manual Linking을 허용해야 할 수 있어요. '+
      '이메일은 Supabase 인증에만 사용하고 친구에게 공개되지 않아요.</p>'+
      '<label for="qd18LinkEmail">본인이 관리하는 이메일</label>'+
      '<input id="qd18LinkEmail" type="email" autocomplete="email" maxlength="180" placeholder="example@email.com">'+
      '<button data-qd18="linkEmail" type="button">인증 이메일 보내기</button>'+
      '<p>이메일을 받은 뒤 인증 링크를 열거나 메일의 6자리 코드를 아래에 입력하세요.</p>'+
      '<label for="qd18VerifyEmail">인증할 이메일</label>'+
      '<input id="qd18VerifyEmail" type="email" autocomplete="email" maxlength="180" placeholder="example@email.com">'+
      '<label for="qd18Otp">이메일 인증 코드 (있을 경우)</label>'+
      '<input id="qd18Otp" type="text" autocomplete="one-time-code" inputmode="numeric" maxlength="8" placeholder="인증 코드">'+
      '<button class="qd18-muted-btn" data-qd18="verify" type="button">코드로 인증하기</button>'+
      '<button class="qd18-muted-btn" data-qd18="status" type="button">인증 상태 다시 확인</button>'+
      '<label for="qd18NewPassword">이메일 인증 후 설정할 새 비밀번호 (12자 이상)</label>'+
      '<input id="qd18NewPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128">'+
      '<button data-qd18="password" type="button">계정 비밀번호 설정</button></details>'+
      '<details><summary>2. 다른 기기에서 QUEST DAY 계정으로 로그인하기</summary>'+
      '<p>원래 기기에서 이메일 인증과 비밀번호 설정을 완료한 경우에만 이용할 수 있어요. '+
      '이 기기의 로컬 데이터는 바로 삭제하지 않으며, 계정의 클라우드 게임 기록을 확인한 후 안전하게 가져와요. '+
      '서로 다른 게임 기록이 있으면 선택할 수 있도록 안내해요.</p>'+
      '<label for="qd18LoginEmail">계정 이메일</label>'+
      '<input id="qd18LoginEmail" type="email" autocomplete="username" maxlength="180" placeholder="example@email.com">'+
      '<label for="qd18LoginPassword">비밀번호</label>'+
      '<input id="qd18LoginPassword" type="password" autocomplete="current-password" maxlength="128">'+
      '<button data-qd18="login" type="button">QUEST DAY 계정으로 로그인</button></details>'+
      '<p>이메일·비밀번호는 이 앱의 로컬 퀘스트 저장 데이터에 넣지 않아요. '+
      '복구 정보 분실 시에는 프로젝트의 인증 설정에 따라 별도 비밀번호 재설정이 필요할 수 있어요.</p>'+
      (notice?'<div class="qd18-feedback" role="status" style="'+(noticeIsError?'color:#ac3655;background:#fff0f4':'')+'">'+safe(notice)+'</div>':"");
  }
  async function updateStatus(){
    if(!isReady()){currentUser=null;render();return;}
    try{
      const result=await userClient().auth.getUser();
      if(result.error)throw result.error;
      currentUser=result.data?.user||null;
    }catch(e){
      notice=e.message||"계정을 확인할 수 없어요.";
      noticeIsError=true;
    }
    render();
  }
  function value(id){return document.getElementById(id)?.value?.trim()||"";}
  function validEmail(email){
    return email.length<=180&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function report(message,failed=false){
    notice=message;noticeIsError=failed;render();
  }
  async function act(name,fields){
    if(busy)return;
    if(!isReady())return report("먼저 친구 탭에서 실시간 서버 연결을 완료해 주세요.",true);
    busy=true;
    try{
      if(name==="status"){await updateStatus();return;}
      if(name==="linkEmail"){
        const email=fields.linkEmail.toLowerCase();
        if(!validEmail(email))throw Error("올바른 이메일 주소를 입력해 주세요.");
        if(!confirm("현재 익명 친구 계정에 이 이메일을 연결하고 확인 메일을 보낼까요?"))return;
        const result=await userClient().auth.updateUser({email});
        if(result.error)throw result.error;
        report("인증 요청을 보냈어요. 메일함에서 확인하고 인증을 완료해 주세요. 이메일 발송량 제한이 있을 수 있어요.");
      }else if(name==="verify"){
        const email=fields.verifyEmail.toLowerCase(),code=fields.code;
        if(!validEmail(email)||!/^\d{6,8}$/.test(code))throw Error("이메일과 6자리 인증 코드를 확인해 주세요.");
        const result=await userClient().auth.verifyOtp({email,token:code,type:"email_change"});
        if(result.error)throw result.error;
        await updateStatus();
        report("이메일 인증 요청을 처리했어요. 인증 상태를 확인한 뒤 비밀번호를 설정해 주세요.");
      }else if(name==="password"){
        const user=(await userClient().auth.getUser()).data?.user;
        if(!user?.email||!user?.email_confirmed_at)throw Error("먼저 이메일 인증을 완료해 주세요.");
        if(fields.password.length<12||fields.password.length>128)throw Error("비밀번호는 12~128자로 설정해 주세요.");
        const result=await userClient().auth.updateUser({password:fields.password});
        if(result.error)throw result.error;
        report("비밀번호를 설정했어요. 이제 다른 기기에서 이 이메일과 비밀번호로 친구 계정에 로그인할 수 있어요. 로그인 정보는 안전하게 보관해 주세요.");
      }else if(name==="login"){
        const email=fields.loginEmail.toLowerCase();
        if(!validEmail(email)||!fields.loginPassword)throw Error("이메일과 비밀번호를 확인해 주세요.");
        if(!confirm("이 기기에서 기존 QUEST DAY 계정으로 로그인할까요?\n\n기기의 게임 기록은 먼저 유지하고, 서버 기록과 비교한 뒤 안전하게 동기화할게요."))return;
        await bridge.waitForIdentity?.();
        const oldId=bridge.getUser()?.id;
        const result=await userClient().auth.signInWithPassword({
          email,password:fields.loginPassword
        });
        if(result.error)throw result.error;
        const newId=result.data?.user?.id;
        if(!newId)throw Error("로그인 결과를 확인할 수 없어요.");
        if(newId!==oldId){
          localStorage.setItem(HOLD_KEY,"yes");
          localStorage.setItem("qd19-game-cloud-consent-v1:"+newId,"yes");
        }
        await bridge.switchIdentity();
        if(!bridge.isReady())throw Error("로그인했지만 친구 서버를 다시 연결하지 못했어요. 친구 탭에서 연결 상태를 확인해 주세요.");
        await updateStatus();
        report(newId===oldId?
          "같은 QUEST DAY 계정으로 로그인했어요.":
          "QUEST DAY 계정으로 로그인했어요. 계정 게임 기록을 가져오고 있으니 위의 클라우드 동기화 상태를 확인해 주세요. 충돌이 나면 두 기록을 보존한 뒤 선택할 수 있어요.");
      }else if(name==="resumeSync"){
        if(!bridge.isProfileSyncHeld?.())return;
        let remoteXP=null;
        try{
          const remote=await userClient().from("qd_profiles").select("xp,quests").eq("user_id",bridge.getUser().id).single();
          if(!remote.error)remoteXP=remote.data?.xp;
        }catch(e){}
        const localXP=totalXp();
        const difference=typeof remoteXP==="number"?
          "서버 누적 XP: "+remoteXP+"\n이 기기 누적 XP: "+localXP+"\n\n":"";
        if(!confirm(difference+"동기화를 재개하면 이 기기의 성장 요약이 서버에 반영됩니다. 원래 친구 계정의 누적 XP가 이 기기보다 많았다면 서버에 표시되는 XP가 줄어들 수 있어요.\n\n기존 게임 백업을 먼저 복원하는 것이 좋습니다. 계속할까요?"))return;
        await bridge.resumeProfileSync();
        report("성장 기록 자동 동기화를 다시 켰어요.");
      }
    }catch(e){
      report(e.message||"계정 보호 작업 중 오류가 발생했어요.",true);
    }finally{busy=false;}
  }
  box.addEventListener("click",event=>{
    const btn=event.target.closest("button[data-qd18]");
    if(!btn)return;
    // Snapshot form values synchronously before any asynchronous redraw.
    const fields={
      linkEmail:value("qd18LinkEmail"),verifyEmail:value("qd18VerifyEmail"),
      code:value("qd18Otp"),password:document.getElementById("qd18NewPassword")?.value||"",
      loginEmail:value("qd18LoginEmail"),loginPassword:document.getElementById("qd18LoginPassword")?.value||""
    };
    act(btn.dataset.qd18,fields);
  });
  const settingsTab=document.querySelector('nav button[data-page="settings"]');
  settingsTab?.addEventListener("click",()=>updateStatus());
  window.addEventListener("qd:realtime-ready",()=>{if(settings.classList.contains("active"))updateStatus();});
  render();
})();
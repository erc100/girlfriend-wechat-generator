const nicknameInput = document.querySelector("#nicknameInput");
const relationSelect = document.querySelector("#relationSelect");
const contextInput = document.querySelector("#contextInput");
const emojiToggle = document.querySelector("#emojiToggle");
const stickerToggle = document.querySelector("#stickerToggle");
const bubbleRange = document.querySelector("#bubbleRange");
const bubbleCount = document.querySelector("#bubbleCount");
const chatPreview = document.querySelector("#chatPreview");
const chatName = document.querySelector("#chatName");
const variantTabs = document.querySelector("#variantTabs");
const noteBox = document.querySelector("#noteBox");
const toast = document.querySelector("#toast");
const generateBtn = document.querySelector("#generateBtn");
const shuffleBtn = document.querySelector("#shuffleBtn");
const copyBtn = document.querySelector("#copyBtn");
const copyTop = document.querySelector("#copyTop");
const wechatBtn = document.querySelector("#wechatBtn");
const clearBtn = document.querySelector("#clearBtn");

let variants = [];
let activeVariant = 0;
let isGenerating = false;

function sanitize(t) { return String(t || "").replace(/[<>]/g, "").trim(); }

async function generate() {
  if (isGenerating) return;
  isGenerating = true;
  generateBtn.disabled = true;
  generateBtn.textContent = "生成中…";

  const nick = sanitize(nicknameInput.value) || "宝";
  const ctx = sanitize(contextInput.value);
  const max = Number(bubbleRange.value);
  const emoji = emojiToggle.checked;
  const sticker = stickerToggle.checked;
  const rel = relationSelect.value;

  let guard = "不要用网络梗、土味情话、强势表白、性暗示。";
  if (rel === "new") guard += " 保持礼貌距离，不用亲昵称呼。";
  if (rel === "crush") guard += " 温暖但别太腻。";

  const prompt = [
    "你是一个女朋友聊天助手。生成微信聊天短句。",
    `称呼：${nick}`,
    `场景：${ctx || "日常分享"}`,
    `语气：根据内容自然判断，不提前定死`,
    `句数：${max} 句`,
    guard,
    emoji ? "" : "不要使用 emoji。",
    sticker ? "" : "不要使用 [贴纸] 字样。",
    "每句独立一行。口语化、自然、短句。不用引号。不发一堆理论。直接出句子。"
  ].filter(Boolean).join("\n");

  noteBox.textContent = "生成中…";
  noteBox.style.background = "#f0f7ff";
  noteBox.style.borderColor = "#a0c4e8";

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-f3f51405b96f40d29ee844202fc4e085"
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      throw new Error(`API ${resp.status}: ${err.slice(0, 60)}`);
    }
    const json = await resp.json();
    const content = (json.choices?.[0]?.message?.content || "").trim();
    const lines = content.split(/\n+/).map(l => l.replace(/^[\d.\-•●]+/, "").trim()).filter(Boolean);
    if (!lines.length) throw new Error("API 返回为空");
    // 请求的和实际的句数可能不全等，但可以用
    variants = [lines.slice(0, max)];
    activeVariant = 0;
    render();
    noteBox.textContent = "已生成，气泡可点开编辑。";
    noteBox.style.background = "#fff8e6";
    noteBox.style.borderColor = "#e9d8a6";
  } catch (e) {
    showToast("生成失败: " + e.message.slice(0, 50));
    noteBox.textContent = "生成失败，请检查网络或 API Key。";
    noteBox.style.background = "#fff0f0";
    noteBox.style.borderColor = "#e6b0b0";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "✦ 生成";
    isGenerating = false;
  }
}

function render() {
  const current = variants[activeVariant] || [];
  chatName.textContent = sanitize(nicknameInput.value) || "宝";
  variantTabs.innerHTML = "";
  variants.forEach((_, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `variant-tab${i === activeVariant ? " is-active" : ""}`;
    tab.textContent = `版${i + 1}`;
    tab.addEventListener("click", () => { activeVariant = i; render(); });
    variantTabs.appendChild(tab);
  });
  chatPreview.innerHTML = "";
  current.forEach((line) => {
    const row = document.createElement("div");
    row.className = "message-row";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.contentEditable = "true";
    bubble.spellcheck = false;
    bubble.textContent = line;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "我";
    row.append(bubble, avatar);
    chatPreview.appendChild(row);
  });
}

function getCurrentText() {
  return [...chatPreview.querySelectorAll(".bubble")]
    .map(b => b.textContent.trim()).filter(Boolean).join("\n");
}

async function copyCurrent(msg) {
  const t = getCurrentText();
  if (!t) return;
  const el = document.createElement("textarea");
  el.value = t;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
  if (navigator.clipboard && window.isSecureContext) try { await navigator.clipboard.writeText(t); } catch {}
  showToast(msg || "已复制");
}

function openWechat() {
  const t = getCurrentText();
  if (!t) return;
  copyCurrent("已复制，正在打开微信");
  setTimeout(() => { window.location.href = "weixin://"; }, 80);
  setTimeout(() => { showToast("已复制，去微信粘贴"); }, 1200);
}

function showToast(msg) {
  toast.textContent = msg || "已复制";
  toast.classList.add("is-showing");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-showing"), 1300);
}

generateBtn.addEventListener("click", generate);
shuffleBtn.addEventListener("click", () => {
  if (!variants.length) generate();
  activeVariant = (activeVariant + 1) % (variants.length || 1);
  render();
});
copyBtn.addEventListener("click", () => copyCurrent());
copyTop.addEventListener("click", () => copyCurrent());
wechatBtn.addEventListener("click", openWechat);
clearBtn.addEventListener("click", () => { contextInput.value = ""; generate(); });
bubbleRange.addEventListener("input", () => { bubbleCount.textContent = bubbleRange.value; });
nicknameInput.addEventListener("input", () => { chatName.textContent = sanitize(nicknameInput.value) || "宝"; });

window.addEventListener("DOMContentLoaded", () => {
  bubbleCount.textContent = bubbleRange.value;
  generate();
});

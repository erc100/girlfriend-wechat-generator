const tones = {
  comfort: {
    label: "哄人",
    emoji: "🥺",
    sticker: "[抱抱]",
    variants: [
      (s) => [`${s.nick}，我在`, "先不讲道理", `我站你这边 ${s.sticker}`],
      (s) => [`听到你说“${s.subject}”`, "我有点心疼", `过来给你抱一下 ${s.emoji}`],
      (s) => [`${s.nick}先别自己消化`, "不开心就丢给我一点", "我接得住"]
    ]
  },
  apology: {
    label: "道歉",
    emoji: "😭",
    sticker: "[委屈]",
    variants: [
      (s) => [`${s.nick}，刚刚是我不对`, "不是想敷衍你", `我现在认真哄你 ${s.emoji}`],
      (s) => ["我刚才说话有点急", "让你不舒服了", "我先道歉，不跟你犟"],
      (s) => [`${s.nick}别气太久嘛`, "我知道我该挨说", `给我一次补救机会 ${s.sticker}`]
    ]
  },
  sweet: {
    label: "撒娇",
    emoji: "😘",
    sticker: "[贴贴]",
    variants: [
      (s) => [`${s.nick}`, "我有点想你了", `不是一点点那种 ${s.emoji}`],
      (s) => ["我申请黏你一下", "就一下下", `不许嫌我烦 ${s.sticker}`],
      (s) => [`${s.nick}你知道吗`, "我刚刚突然很想见你", "有点没出息"]
    ]
  },
  daily: {
    label: "日常",
    emoji: "😂",
    sticker: "[分享]",
    variants: [
      (s) => ["刚刚路上风好大", "我差点被吹成表情包", `你那边冷不冷呀 ${s.emoji}`],
      (s) => [`${s.nick}`, `我刚刚想到“${s.subject}”`, "感觉很适合发给你"],
      (s) => ["今天有个小事", "本来没什么", "但突然就想跟你说"]
    ]
  },
  night: {
    label: "晚安",
    emoji: "😌",
    sticker: "[盖被子]",
    variants: [
      (s) => [`不早啦${s.nick}`, "快去睡觉", `梦里也要被我抱一下 ${s.emoji}`],
      (s) => [`今天辛苦啦${s.nick}`, "我把晚安放这", "你睡醒就能看到"],
      (s) => ["晚安啦", "别熬太晚", `我负责远程给你盖被子 ${s.sticker}`]
    ]
  },
  invite: {
    label: "约见面",
    emoji: "🤏",
    sticker: "[期待]",
    variants: [
      (s) => [`${s.nick}`, "这周找个时间见一下面?", "周六下午或者周日晚上", "你不方便也没事"],
      (s) => ["那家店听起来不错", "要不要一起去试试?", `我负责做攻略 ${s.emoji}`],
      (s) => ["我想把聊天搬到现实里", "喝杯咖啡?", "你忙的话我们下次"]
    ]
  },
  funny: {
    label: "逗她",
    emoji: "😂",
    sticker: "[偷笑]",
    variants: [
      (s) => ["你刚刚那句", "有点把我拿捏住了", `我申请重听一遍 ${s.emoji}`],
      (s) => [`${s.nick}你是不是偷练了`, "怎么一句话", "就让我开始反省"],
      (s) => ["我本来很淡定", "看到你这句", `直接破功 ${s.sticker}`]
    ]
  },
  serious: {
    label: "认真",
    emoji: "😌",
    sticker: "[认真]",
    variants: [
      (s) => [`${s.nick}，这件事我想认真说`, "我在意你的感受", "我们慢慢聊，不吵"],
      (s) => ["我不想敷衍过去", "也不想让你一个人难受", "你说，我认真听"],
      (s) => ["这次我先不急着解释", "我想先听你怎么想", `然后我们一起说清楚 ${s.emoji}`]
    ]
  }
};

const contextInput = document.querySelector("#contextInput");
const nicknameInput = document.querySelector("#nicknameInput");
const relationSelect = document.querySelector("#relationSelect");
const emojiToggle = document.querySelector("#emojiToggle");
const stickerToggle = document.querySelector("#stickerToggle");
const bubbleRange = document.querySelector("#bubbleRange");
const bubbleCount = document.querySelector("#bubbleCount");
const chatPreview = document.querySelector("#chatPreview");
const chatName = document.querySelector("#chatName");
const variantTabs = document.querySelector("#variantTabs");
const noteBox = document.querySelector("#noteBox");
const toast = document.querySelector("#toast");

let activeTone = "comfort";
let variants = [];
let activeVariant = 0;

function sanitize(text) {
  return String(text || "").replace(/[<>]/g, "").trim();
}

function getSubject(text) {
  const cleaned = sanitize(text)
    .replace(/^她说[:：]?/, "")
    .replace(/^女朋友说[:：]?/, "")
    .replace(/^我想[:：]?/, "")
    .replace(/^想[:：]?/, "");
  const quoted = cleaned.match(/[“"']([^”"']{1,34})[”"']/);
  if (quoted) return quoted[1];
  return cleaned.slice(0, 24) || "这件事";
}

function relationSafeTone(lines, relation) {
  if (relation === "new") {
    return lines.map((line) =>
      line
        .replace(/宝|宝宝|老婆|乖乖/g, "你")
        .replace(/抱一下|贴一下|亲一下|梦里也要被我抱一下/g, "轻松聊一下")
        .replace(/想见你/g, "想继续聊聊")
    );
  }
  if (relation === "crush") {
    return lines.map((line) => line.replace(/老婆/g, "你").replace(/亲一下/g, "见一面"));
  }
  return lines;
}

function fitBubbleCount(lines, max) {
  const clean = lines.filter(Boolean);
  if (clean.length <= max) return clean;
  if (max === 1) return [clean.join("，")];
  return [...clean.slice(0, max - 1), clean.slice(max - 1).join("，")];
}

function stripEmojiAndStickers(lines, includeEmoji, includeSticker) {
  return lines.map((line) => {
    let next = line;
    if (!includeEmoji) {
      next = next.replace(/[🥺😭😌😘😂🤏]/g, "").replace(/\s{2,}/g, " ");
    }
    if (!includeSticker) {
      next = next.replace(/\[[^\]]+\]/g, "").replace(/\s{2,}/g, " ");
    }
    return next.trim();
  });
}

function buildState(toneKey) {
  const nick = sanitize(nicknameInput.value) || "宝";
  const context = sanitize(contextInput.value);
  const tone = tones[toneKey] || tones.comfort;
  return {
    nick,
    context,
    subject: getSubject(context),
    emoji: emojiToggle.checked ? tone.emoji : "",
    sticker: stickerToggle.checked ? tone.sticker : ""
  };
}

function generate() {
  const requested = activeTone;
  const tone = tones[requested] || tones[activeTone];
  const state = buildState(requested);
  const maxBubbles = Number(bubbleRange.value);
  variants = tone.variants.map((builder) => {
    let lines = builder(state);
    lines = relationSafeTone(lines, relationSelect.value);
    lines = stripEmojiAndStickers(lines, emojiToggle.checked, stickerToggle.checked);
    return fitBubbleCount(lines, maxBubbles);
  });
  activeVariant = 0;
  render();
}

function render() {
  const current = variants[activeVariant] || [];
  chatName.textContent = sanitize(nicknameInput.value) || "宝";

  variantTabs.innerHTML = "";
  variants.forEach((_, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `variant-tab${index === activeVariant ? " is-active" : ""}`;
    tab.textContent = `版${index + 1}`;
    tab.addEventListener("click", () => {
      activeVariant = index;
      render();
    });
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

  noteBox.textContent = buildNote();
  refreshIcons();
}

function buildNote() {
  const text = contextInput.value || "";
  if (/不关心|难过|累|烦|委屈|哭|崩/.test(text)) {
    return "先接住情绪，再给一个小行动，不急着讲道理。";
  }
  if (/不回|没回|不理|冷淡/.test(text)) {
    return "她反应弱时，发一版就停，不要连续追问。";
  }
  if (/生气|吵|说重|错|道歉/.test(text)) {
    return "道歉场景先接情绪，再补行动，少解释。";
  }
  if (/约|见面|吃饭|电影|咖啡/.test(text)) {
    return "邀约要给选择，也要给退路。";
  }
  return "气泡可以直接点开编辑，再复制。";
}

function getCurrentText() {
  return [...chatPreview.querySelectorAll(".bubble")]
    .map((bubble) => bubble.textContent.trim())
    .filter(Boolean)
    .join("\n");
}

async function copyCurrent() {
  const text = getCurrentText();
  if (!text) return;
  window.__lastCopiedText = text;
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
  } catch {}
  showToast();
}

function showToast() {
  toast.classList.add("is-showing");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-showing"), 1300);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.querySelectorAll(".tone-button").forEach((button) => {
  button.addEventListener("click", () => {
    setTone(button.dataset.tone, false);
    generate();
  });
});

document.querySelectorAll(".quick-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    contextInput.value = chip.dataset.example;
    setTone(chip.dataset.tone || "comfort", false);
    generate();
  });
});

function setTone(toneKey) {
  activeTone = toneKey;
  document.querySelectorAll(".tone-button").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.tone === toneKey);
  });
}

document.querySelector("#generateBtn").addEventListener("click", generate);
document.querySelector("#shuffleBtn").addEventListener("click", () => {
  if (!variants.length) generate();
  activeVariant = (activeVariant + 1) % variants.length;
  render();
});
document.querySelector("#copyBtn").addEventListener("click", copyCurrent);
document.querySelector("#copyTop").addEventListener("click", copyCurrent);
document.querySelector("#clearBtn").addEventListener("click", () => {
  contextInput.value = "";
  generate();
});

[contextInput, nicknameInput, relationSelect, emojiToggle, stickerToggle].forEach((control) => {
  control.addEventListener("input", generate);
  control.addEventListener("change", generate);
});

bubbleRange.addEventListener("input", () => {
  bubbleCount.textContent = bubbleRange.value;
  generate();
});

window.addEventListener("DOMContentLoaded", () => {
  bubbleCount.textContent = bubbleRange.value;
  generate();
  refreshIcons();
});

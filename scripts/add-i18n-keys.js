const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "messages");

// Add nested keys under speaking.feedback
const newFeedbackKeys = {
  pronunciation: {
    en: "Pronunciation", tr: "Telaffuz", rw: "Imvugo", fr: "Prononciation",
    es: "Pronunciación", de: "Aussprache", ar: "النطق", pt: "Pronúncia",
    zh: "发音", ja: "発音", ko: "발음", hi: "उच्चारण",
  },
  intonation: {
    en: "Intonation & Rhythm", tr: "Tonlama ve Ritim", rw: "Amajwi n'Umuvuduko",
    fr: "Intonation et rythme", es: "Entonación y ritmo", de: "Intonation und Rhythmus",
    ar: "التنغيم والإيقاع", pt: "Entonação e ritmo", zh: "语调与节奏",
    ja: "イントネーションとリズム", ko: "억양과 리듬", hi: "स्वरमान और लय",
  },
  fillerAnalysis: {
    en: "Filler Word Analysis", tr: "Dolgu Kelime Analizi", rw: "Isesengura ry'amagambo y'ubusa",
    fr: "Analyse des mots de remplissage", es: "Análisis de muletillas", de: "Füllwort-Analyse",
    ar: "تحليل الكلمات الحشوية", pt: "Análise de palavras de preenchimento", zh: "填充词分析",
    ja: "フィラーワード分析", ko: "추임새 분석", hi: "भराव शब्द विश्लेषण",
  },
};

const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "en.json");
for (const file of files) {
  const locale = file.replace(".json", "");
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (data.speaking && data.speaking.feedback) {
    let changed = false;
    for (const [key, translations] of Object.entries(newFeedbackKeys)) {
      if (!data.speaking.feedback[key]) {
        data.speaking.feedback[key] = translations[locale] || translations.en;
        changed = true;
      }
    }
    // Also update fluency label
    if (data.speaking.feedback.fluency && !data.speaking.feedback.fluency.includes("&") && !data.speaking.feedback.fluency.includes("ve") && !data.speaking.feedback.fluency.includes("et")) {
      const fluencyLabels = {
        tr: "Akıcılık ve Hız", rw: "Kuvuga neza n'Umuvuduko", fr: "Fluidité et rythme",
        es: "Fluidez y ritmo", de: "Flüssigkeit und Tempo", ar: "الطلاقة والإيقاع",
        pt: "Fluência e ritmo", zh: "流利度与节奏", ja: "流暢さとペース",
        ko: "유창성과 속도", hi: "प्रवाह और गति",
      };
      if (fluencyLabels[locale]) {
        data.speaking.feedback.fluency = fluencyLabels[locale];
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
      console.log("Updated:", file);
    }
  }
}
console.log("Done!");

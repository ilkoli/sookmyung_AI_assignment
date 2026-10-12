export default async function handler(req, res) {
  // CORS 허용 (GitHub Pages와 통신용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 가능합니다.' });
  }

  const { comparisonText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  const prompt = `당신은 소개팅 연애 코칭 전문가입니다. 아래 두 사람(A와 B)의 10개 질문 답변을 바탕으로 매칭 궁합을 분석해 주세요.

${comparisonText}

반드시 다른 부연설명 없이 아래 JSON 규격으로만 응답하세요:
{
  "score": 85,
  "summary": "한 줄 요약 총평",
  "strengths": ["잘 맞는 점 1", "잘 맞는 점 2"],
  "cautions": ["주의/배려할 점 1", "주의/배려할 점 2"]
}`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Google API 호출 오류' 
      });
    }

    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).send(textOutput);
  } catch (err) {
    return res.status(500).json({ error: `서버 내부 에러: ${err.message}` });
  }
}

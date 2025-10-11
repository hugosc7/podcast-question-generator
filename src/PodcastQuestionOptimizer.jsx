import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PodcastQuestionOptimizer() {
  const [audience, setAudience] = useState('');
  const [guestBio, setGuestBio] = useState('');
  const [questions, setQuestions] = useState('');
  const [generateMode, setGenerateMode] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzQuestions = async () => {
    if (!audience.trim() || !guestBio.trim()) {
      setError('Please fill in audience and guest bio fields.');
      return;
    }

    if (!generateMode && !questions.trim()) {
      setError('Please enter your questions or check "Come up with questions for me".');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      let prompt;
      
      if (generateMode) {
        // Generate questions mode
        prompt = `You are a professional journalist and interviewing expert. Your role is to create excellent podcast interview questions based on journalism best practices.

PODCAST AUDIENCE:
${audience}

GUEST BIO:
${guestBio}

Please generate 8-12 thoughtful, engaging interview questions for this podcast. For your response, use the following JSON structure:

{
  "introduction": "A brief 2-3 sentence explanation of your approach to these questions",
  "questions": [
    {
      "question": "the interview question",
      "purpose": "what this question aims to achieve",
      "followUpSuggestion": "a suggestion for a potential follow-up question or direction"
    }
  ],
  "journalismPrinciples": ["principle 1 applied", "principle 2 applied", "principle 3 applied"],
  "interviewTips": ["tip 1 for conducting this interview", "tip 2", "tip 3"]
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON structure. Do not use markdown code blocks or backticks. Your entire response must be a single valid JSON object.`;
      } else {
        // Analyze existing questions mode
        prompt = `You are a professional journalist and interviewing expert. Your role is to provide constructive criticism and help improve podcast interview questions based on journalism best practices.

PODCAST AUDIENCE:
${audience}

GUEST BIO:
${guestBio}

INTERVIEW QUESTIONS:
${questions}

Please analyze these questions and provide detailed feedback. For your response, use the following JSON structure:

{
  "overallAssessment": "A brief 2-3 sentence overall assessment of the questions",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "questionFeedback": [
    {
      "original": "the original question text",
      "feedback": "specific feedback about this question",
      "improved": "your improved version of the question",
      "reasoning": "why this improvement works better"
    }
  ],
  "journalismPrinciples": ["principle 1 applied", "principle 2 applied", "principle 3 applied"],
  "additionalTips": ["tip 1", "tip 2", "tip 3"]
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text outside the JSON structure. Do not use markdown code blocks or backticks. Your entire response must be a single valid JSON object.`;
      }

      // Use Cloudflare Worker proxy (secure)
      const response = await fetch('https://podcast-question-proxy.hugo-3ec.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional journalist and interviewing expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content;
      
      // Strip markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedFeedback = JSON.parse(responseText);
      setFeedback(parsedFeedback);
    } catch (err) {
      console.error('Error analyzing questions:', err);
      setError(err.message || 'Failed to analyze questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFeedback(null);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0113',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '24px',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <a href="https://moondeskmedia.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="236" height="33.3" viewBox="0 0 236 33.3">
              <defs>
                <clipPath id="clip-path">
                  <rect id="Rectangle_1" data-name="Rectangle 1" width="236" height="33.3" fill="#fff"></rect>
                </clipPath>
              </defs>
              <g id="Group_2" data-name="Group 2" style={{ mixBlendMode: 'normal', isolation: 'isolate' }}>
                <g id="Group_1" data-name="Group 1" clipPath="url(#clip-path)">
                  <path id="Path_1" data-name="Path 1" d="M32.838,16.65A16.65,16.65,0,0,1,16.189,33.3a16.442,16.442,0,0,1-1.854-.1,22.13,22.13,0,0,0,7.4-16.546A22.127,22.127,0,0,0,14.333.1,16.472,16.472,0,0,1,16.189,0,16.651,16.651,0,0,1,32.838,16.65M.95,22.631A6.048,6.048,0,0,0,6,16.651a6.045,6.045,0,0,0-5.06-5.984.8.8,0,0,0-.265,1.586,4.442,4.442,0,0,1,3.718,4.4,4.445,4.445,0,0,1-3.707,4.4A.8.8,0,1,0,.95,22.631M4,27.334A11.333,11.333,0,0,0,4,5.968a.8.8,0,1,0-.536,1.515,9.726,9.726,0,0,1,0,18.336.8.8,0,0,0,.268,1.561A.792.792,0,0,0,4,27.334m5.1,3.688A16.6,16.6,0,0,0,9.1,2.28a.8.8,0,1,0-.8,1.391,14.989,14.989,0,0,1,0,25.96.8.8,0,1,0,.8,1.391" transform="translate(0 0)" fill="#fff"></path>
                  <path id="Path_2" data-name="Path 2" d="M102.053,33.381l-.022-13.5-6.6,11.4h-.563l-6.6-11.359V33.381H87.133V17.6H88.1L95.156,29.8,102.211,17.6h.947l.023,15.777Z" transform="translate(-41.919 -8.469)" fill="#fff"></path>
                  <path id="Path_3" data-name="Path 3" d="M128.358,36.34a5.515,5.515,0,0,1-2.107-2.13,6.562,6.562,0,0,1,0-6.153,5.52,5.52,0,0,1,2.107-2.13,6.29,6.29,0,0,1,6.018,0,5.52,5.52,0,0,1,2.107,2.13,6.558,6.558,0,0,1,0,6.153,5.515,5.515,0,0,1-2.107,2.13,6.29,6.29,0,0,1-6.018,0m5.432-.879a4.528,4.528,0,0,0,1.69-1.758,5.633,5.633,0,0,0,0-5.139,4.531,4.531,0,0,0-1.69-1.758,4.967,4.967,0,0,0-4.846,0,4.529,4.529,0,0,0-1.691,1.758,5.637,5.637,0,0,0,0,5.139,4.525,4.525,0,0,0,1.691,1.758,4.967,4.967,0,0,0,4.846,0" transform="translate(-60.37 -12.105)" fill="#fff"></path>
                  <path id="Path_4" data-name="Path 4" d="M155.287,36.34a5.515,5.515,0,0,1-2.107-2.13,6.562,6.562,0,0,1,0-6.153,5.52,5.52,0,0,1,2.107-2.13,6.289,6.289,0,0,1,6.018,0,5.52,5.52,0,0,1,2.107,2.13,6.558,6.558,0,0,1,0,6.153,5.515,5.515,0,0,1-2.107,2.13,6.29,6.29,0,0,1-6.018,0m5.432-.879a4.528,4.528,0,0,0,1.69-1.758,5.633,5.633,0,0,0,0-5.139,4.531,4.531,0,0,0-1.69-1.758,4.967,4.967,0,0,0-4.846,0,4.529,4.529,0,0,0-1.691,1.758,5.637,5.637,0,0,0,0,5.139,4.525,4.525,0,0,0,1.691,1.758,4.967,4.967,0,0,0,4.846,0" transform="translate(-73.325 -12.105)" fill="#fff"></path>
                  <path id="Path_5" data-name="Path 5" d="M191.059,26.446a5,5,0,0,1,1.285,3.7v6.875h-1.127V30.232a4.176,4.176,0,0,0-1-3.02,3.722,3.722,0,0,0-2.806-1.037,4.326,4.326,0,0,0-3.268,1.24,4.6,4.6,0,0,0-1.195,3.336v6.266h-1.127V25.251H182.9V27.8a4.478,4.478,0,0,1,1.814-1.938,5.593,5.593,0,0,1,2.851-.7,4.719,4.719,0,0,1,3.493,1.285" transform="translate(-87.471 -12.105)" fill="#fff"></path>
                  <path id="Path_6" data-name="Path 6" d="M211.744,17.6h6.244a9.143,9.143,0,0,1,4.361,1.014,7.42,7.42,0,0,1,2.964,2.806,7.842,7.842,0,0,1,1.059,4.068,7.84,7.84,0,0,1-1.059,4.068,7.416,7.416,0,0,1-2.964,2.806,9.137,9.137,0,0,1-4.361,1.014h-6.244Zm6.153,14.74a8.232,8.232,0,0,0,3.854-.868,6.209,6.209,0,0,0,2.57-2.423,6.972,6.972,0,0,0,.9-3.561,6.973,6.973,0,0,0-.9-3.561,6.209,6.209,0,0,0-2.57-2.423,8.239,8.239,0,0,0-3.854-.868h-5v13.7Z" transform="translate(-101.868 -8.469)" fill="#fff"></path>
                  <path id="Path_7" data-name="Path 7" d="M255.674,31.405h-10.12a4.915,4.915,0,0,0,.7,2.446,4.468,4.468,0,0,0,1.77,1.656,5.313,5.313,0,0,0,2.513.586,5.382,5.382,0,0,0,2.13-.417,4.145,4.145,0,0,0,1.634-1.228l.654.744a5.022,5.022,0,0,1-1.927,1.42,6.712,6.712,0,0,1-5.646-.271,5.552,5.552,0,0,1-2.152-2.118,6.084,6.084,0,0,1-.778-3.088,6.4,6.4,0,0,1,.733-3.077,5.408,5.408,0,0,1,2.017-2.13,5.83,5.83,0,0,1,5.759-.011,5.379,5.379,0,0,1,2.006,2.107,6.338,6.338,0,0,1,.732,3.065Zm-7.821-4.7a4.207,4.207,0,0,0-1.589,1.555,5.058,5.058,0,0,0-.688,2.265h9.016a4.718,4.718,0,0,0-.676-2.254,4.377,4.377,0,0,0-3.832-2.119,4.51,4.51,0,0,0-2.231.552" transform="translate(-117.602 -12.105)" fill="#fff"></path>
                  <path id="Path_8" data-name="Path 8" d="M271.517,36.679a5.583,5.583,0,0,1-2.006-1.082l.518-.9a5.958,5.958,0,0,0,1.86,1.014,7.029,7.029,0,0,0,2.378.406,4.667,4.667,0,0,0,2.626-.586,1.868,1.868,0,0,0,.845-1.623,1.519,1.519,0,0,0-.462-1.172,2.842,2.842,0,0,0-1.138-.631,19.175,19.175,0,0,0-1.871-.428,15.589,15.589,0,0,1-2.254-.541,3.528,3.528,0,0,1-1.465-.946,2.545,2.545,0,0,1-.608-1.8,2.82,2.82,0,0,1,1.16-2.31,5.234,5.234,0,0,1,3.3-.913,8.1,8.1,0,0,1,2.231.315,5.6,5.6,0,0,1,1.8.834l-.519.9a5.393,5.393,0,0,0-1.645-.789,6.718,6.718,0,0,0-1.893-.27,4.192,4.192,0,0,0-2.479.608,1.892,1.892,0,0,0-.833,1.6,1.593,1.593,0,0,0,.473,1.228,2.985,2.985,0,0,0,1.161.653q.687.215,1.927.462a16.567,16.567,0,0,1,2.22.53,3.377,3.377,0,0,1,1.431.912,2.454,2.454,0,0,1,.586,1.736,2.751,2.751,0,0,1-1.217,2.344,5.775,5.775,0,0,1-3.426.879,8.5,8.5,0,0,1-2.7-.428" transform="translate(-129.659 -12.105)" fill="#fff"></path>
                  <path id="Path_9" data-name="Path 9" d="M297.809,26.215l-3.065,2.795V32.5h-1.127V15.78h1.127V27.613l7.528-6.875h1.443l-5.071,4.756,5.567,7.009h-1.4Z" transform="translate(-141.256 -7.591)" fill="#fff"></path>
                  <path id="Path_10" data-name="Path 10" d="M345.933,33.381l-.022-13.5-6.6,11.4h-.564l-6.6-11.359V33.381h-1.127V17.6h.969L339.036,29.8,346.091,17.6h.947l.023,15.777Z" transform="translate(-159.247 -8.469)" fill="#fff"></path>
                  <path id="Path_11" data-name="Path 11" d="M380.59,31.405H370.47a4.915,4.915,0,0,0,.7,2.446,4.468,4.468,0,0,0,1.77,1.656,5.313,5.313,0,0,0,2.513.586,5.382,5.382,0,0,0,2.13-.417,4.146,4.146,0,0,0,1.634-1.228l.654.744a5.021,5.021,0,0,1-1.927,1.42,6.712,6.712,0,0,1-5.646-.271,5.552,5.552,0,0,1-2.152-2.118,6.084,6.084,0,0,0-.778-3.088,6.4,6.4,0,0,1,.733-3.077,5.407,5.407,0,0,1,2.017-2.13,5.83,5.83,0,0,1,5.759-.011,5.375,5.375,0,0,1,2.006,2.107,6.338,6.338,0,0,1,.732,3.065Zm-7.821-4.7a4.207,4.207,0,0,0-1.589,1.555,5.058,5.058,0,0,0-.688,2.265h9.016a4.718,4.718,0,0,0-.676-2.254A4.378,4.378,0,0,0,375,26.154a4.51,4.51,0,0,0-2.231.552" transform="translate(-177.698 -12.105)" fill="#fff"></path>
                  <path id="Path_12" data-name="Path 12" d="M407.037,15.78V32.5h-1.1V29.731a5.053,5.053,0,0,1-1.961,2.118,5.531,5.531,0,0,1-2.862.744,5.85,5.85,0,0,1-2.975-.766,5.483,5.483,0,0,1-2.085-2.119,6.223,6.223,0,0,1-.754-3.088,6.292,6.292,0,0,1,.754-3.1,5.389,5.389,0,0,1,2.085-2.118,5.921,5.921,0,0,1,2.975-.756,5.428,5.428,0,0,1,2.829.744,5.3,5.3,0,0,1,1.972,2.074V15.78ZM403.6,30.948a4.533,4.533,0,0,0,1.691-1.758,5.637,5.637,0,0,0,0-5.139,4.536,4.536,0,0,0-1.691-1.758,4.967,4.967,0,0,0-4.846,0,4.529,4.529,0,0,0-1.691,1.758,5.637,5.637,0,0,0,0,5.139,4.526,4.526,0,0,0,1.691,1.758,4.967,4.967,0,0,0,4.846,0" transform="translate(-190.172 -7.591)" fill="#fff"></path>
                  <path id="Path_13" data-name="Path 13" d="M426.664,17.868a.852.852,0,0,1-.27-.642.923.923,0,0,1,.924-.924.91.91,0,0,1,.654.259.853.853,0,0,1,.27.642.923.923,0,0,1-.924.924.909.909,0,0,1-.653-.259m.09,3.122h1.127V32.755h-1.127Z" transform="translate(-205.134 -7.842)" fill="#fff"></path>
                  <path id="Path_14" data-name="Path 14" d="M444.767,26.277a4.318,4.318,0,0,1,1.172,3.28v7.46h-1.082v-2.1a3.91,3.91,0,0,1-1.645,1.611,5.457,5.457,0,0,1-2.591.575,4.776,4.776,0,0,1-3.1-.924,3.2,3.2,0,0,1-.09-4.812,5.032,5.032,0,0,1,3.346-.913h4.035v-.946a3.316,3.316,0,0,0-.89-2.5,3.615,3.615,0,0,0-2.6-.857,6.264,6.264,0,0,0-2.242.406,5.63,5.63,0,0,0-1.815,1.081l-.564-.811a6.259,6.259,0,0,1,2.119-1.229,7.706,7.706,0,0,1,2.592-.44,4.683,4.683,0,0,1,3.358,1.116m-1.5,9.23a4.119,4.119,0,0,0,1.544-1.961V31.337H440.8a3.994,3.994,0,0,0-2.513.632,2.113,2.113,0,0,0-.777,1.735,2.172,2.172,0,0,0,.856,1.814,3.85,3.85,0,0,0,2.411.665,4.429,4.429,0,0,0,2.491-.676" transform="translate(-209.939 -12.105)" fill="#fff"></path>
                </g>
              </g>
            </svg>
          </a>
          <div style={{
            background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            Podcast Interview Optimizer
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            AI-powered journalism insights to elevate your interview questions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {!feedback ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Input Form */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Podcast Audience
                </label>
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Describe your audience demographics, interests, and what they hope to learn..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '16px',
                    background: '#0B0113',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Guest Bio
                </label>
                <textarea
                  value={guestBio}
                  onChange={(e) => setGuestBio(e.target.value)}
                  placeholder="Share your guest's background, expertise, achievements, and why they're being interviewed..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '16px',
                    background: '#0B0113',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FECE00'
                }}>
                  Interview Questions
                </label>
                
                <div style={{
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    id="generateMode"
                    checked={generateMode}
                    onChange={(e) => setGenerateMode(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#FECE00'
                    }}
                  />
                  <label
                    htmlFor="generateMode"
                    style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Come up with questions for me
                  </label>
                </div>

                {!generateMode && (
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="Enter your interview questions (one per line or numbered)..."
                    style={{
                      width: '100%',
                      minHeight: '240px',
                      padding: '16px',
                      background: '#0B0113',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '15px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.6'
                    }}
                  />
                )}
                
                {generateMode && (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(254, 206, 0, 0.1)',
                    border: '1px solid rgba(254, 206, 0, 0.3)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#FECE00' }}>AI Generation Mode:</strong> Based on your audience and guest information, I'll create professional interview questions tailored to your podcast.
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertCircle size={20} color="#ef4444" />
                  <span style={{ color: '#fca5a5' }}>{error}</span>
                </div>
              )}

              <button
                onClick={analyzQuestions}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading ? 'rgba(255,255,255,0.5)' : '#0B0113',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                  transform: loading ? 'none' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    {generateMode ? 'Generating Questions...' : 'Analyzing Questions...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    {generateMode ? 'Generate Questions' : 'Analyze Questions'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Results */}
            <div style={{ marginBottom: '32px' }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ← {generateMode ? 'Generate New Questions' : 'Analyze New Questions'}
              </button>
            </div>

            {/* Generated Questions Flow */}
            {generateMode && feedback.questions ? (
              <div>
                {/* Introduction */}
                <div style={{
                  background: 'rgba(254, 206, 0, 0.1)',
                  border: '1px solid rgba(254, 206, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <Sparkles size={24} color="#FECE00" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Generated Questions</h2>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                    {feedback.introduction}
                  </p>
                </div>

                {/* Questions List */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '24px',
                    background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Your Interview Questions
                  </h2>
                  {feedback.questions.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#FECE00',
                        marginBottom: '16px'
                      }}>
                        QUESTION {i + 1}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{
                          margin: 0,
                          padding: '16px',
                          background: 'linear-gradient(90deg, rgba(254, 206, 0, 0.1) 0%, rgba(244, 76, 10, 0.1) 50%, rgba(242, 61, 190, 0.1) 100%)',
                          border: '1px solid rgba(254, 206, 0, 0.3)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          fontWeight: '500'
                        }}>
                          {item.question}
                        </p>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Purpose
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {item.purpose}
                        </p>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Follow-up Suggestion
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)',
                          fontStyle: 'italic'
                        }}>
                          {item.followUpSuggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Journalism Principles */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#D16A97'
                  }}>
                    Journalism Best Practices Applied
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.journalismPrinciples.map((principle, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{principle}</li>
                    ))}
                  </ul>
                </div>

                {/* Interview Tips */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#FECE00'
                  }}>
                    Interview Tips
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.interviewTips.map((tip, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                {/* Overall Assessment */}
                <div style={{
                  background: 'rgba(254, 206, 0, 0.1)',
                  border: '1px solid rgba(254, 206, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={24} color="#FECE00" />
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Overall Assessment</h2>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                    {feedback.overallAssessment}
                  </p>
                </div>

                {/* Strengths & Areas for Improvement */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#FECE00'
                    }}>
                      Strengths
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                      {feedback.strengths.map((strength, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#D16A97'
                    }}>
                      Areas for Improvement
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                      {feedback.areasForImprovement.map((area, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Question Feedback */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '24px',
                    background: 'linear-gradient(90deg,rgba(254, 206, 0, 1) 0%, rgba(244, 76, 10, 1) 50%, rgba(242, 61, 190, 1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Question-by-Question Feedback
                  </h2>
                  {feedback.questionFeedback.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#FECE00',
                        marginBottom: '16px'
                      }}>
                        QUESTION {i + 1}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Original
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          lineHeight: '1.6'
                        }}>
                          {item.original}
                        </p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Feedback
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {item.feedback}
                        </p>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#FECE00',
                          marginBottom: '8px'
                        }}>
                          Improved Version
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '12px',
                          background: 'linear-gradient(90deg, rgba(254, 206, 0, 0.1) 0%, rgba(244, 76, 10, 0.1) 50%, rgba(242, 61, 190, 0.1) 100%)',
                          border: '1px solid rgba(254, 206, 0, 0.3)',
                          borderRadius: '6px',
                          lineHeight: '1.6'
                        }}>
                          {item.improved}
                        </p>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '8px'
                        }}>
                          Why This Works
                        </div>
                        <p style={{
                          margin: 0,
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.85)',
                          fontStyle: 'italic'
                        }}>
                          {item.reasoning}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Journalism Principles */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#D16A97'
                  }}>
                    Journalism Best Practices Applied
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.journalismPrinciples.map((principle, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{principle}</li>
                    ))}
                  </ul>
                </div>

                {/* Additional Tips */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#FECE00'
                  }}>
                    Additional Tips
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                    {feedback.additionalTips.map((tip, i) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.85)' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}


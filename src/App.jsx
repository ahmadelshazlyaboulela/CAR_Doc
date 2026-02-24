import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Wrench, AlertTriangle, ShieldCheck, Cpu, 
  DollarSign, Activity, MapPin, BarChart3, ChevronLeft,
  CheckCircle2, Navigation, Layers, Loader2, Clock,
  Camera, Mic, Thermometer, Droplets, Gauge, Info,
  Share2, Zap, Smartphone, Settings, History, 
  Lightbulb, Scan, BrainCircuit, MessageSquare, Phone,
  User, X, MicOff, Volume2, Hammer, Heart
} from 'lucide-react';

/**
 * CAR_DOC - النسخة النهائية الفائقة (Hybrid AI System)
 * المهندس المطور: أحمد شاذلي (Ahmad Shazli)
 * كلية الحاسبات والذكاء الاصطناعي
 */

// --- Gemini API Configuration ---
const apiKey = ""; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

export default function App() {
  // --- UI & Navigation States ---
  const [view, setView] = useState('home'); // home, scanning, result
  const [inputType, setInputType] = useState('text'); // text, voice, vision
  const [userInput, setUserInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDevInfo, setShowDevInfo] = useState(false);
  
  // --- AI & Data States ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [dbMatch, setDbMatch] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [faultsDatabase, setFaultsDatabase] = useState([]);
  const [iotStats, setIotStats] = useState({ temp: 91, fuel: 64, health: 96 });

  // --- 1. Load Ahmad Shazli's CSV Database (الاستبن الذكي) ---
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        // Fetch from public/data/car_faults_db.csv
        const response = await fetch('/data/car_faults_db.csv');
        if (!response.ok) throw new Error("Database file missing");
        
        const text = await response.text();
        const lines = text.split('\n');
        
        const parsedData = lines.slice(1).map(line => {
          const v = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (v.length >= 6) {
            return {
              code: v[0]?.replace(/"/g, '').trim(),
              desc: v[1]?.replace(/"/g, '').trim(),
              part: v[2]?.replace(/"/g, '').trim(),
              price: v[3]?.replace(/"/g, '').trim(),
              hours: v[4]?.replace(/"/g, '').trim(),
              labor: v[5]?.replace(/"/g, '').trim(),
              source: v[6]?.replace(/"/g, '').trim() || "سوق الحرفيين/التوفيقية"
            };
          }
          return null;
        }).filter(Boolean);

        setFaultsDatabase(parsedData);
      } catch (err) {
        console.error("CSV Loading Error:", err);
      }
    };
    loadDatabase();
  }, []);

  // --- 2. Voice Recognition (Speech to Text) ---
  const startVoiceCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("عذراً، متصفحك لا يدعم خاصية التعرف على الصوت.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- 3. Image Processing Handler ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- 4. Hybrid Diagnostic Logic (AI Core + DB cross-reference) ---
  const handleDiagnosticAction = async () => {
    if (!userInput && !selectedImage) return;

    setIsAnalyzing(true);
    setView('scanning');
    setScanLogs([
      "جاري استدعاء المعالج العصبي CAR_DOC...",
      "تحليل المدخلات الميكانيكية والفيزيائية...",
      "مطابقة الأنماط مع قاعدة بيانات المهندس أحمد شاذلي...",
      "جاري استخراج بيانات الأسعار والمناطق من 'الاستبن' الرقمي..."
    ]);

    const systemInstruction = `
      أنت CAR_DOC AI Engine، خبير ميكانيكا مصري تعمل لصالح المهندس أحمد شاذلي.
      حلل العطل بناءً على المدخلات (نص أو صورة) وقدم تشخيصاً دقيقاً ومختصراً بلهجة مصرية احترافية.
      مهم جداً: إذا اكتشفت كود عطل (مثل P0171 أو P0300) يجب كتابته في أول سطر بتنسيق [CODE: XXXX].
      تنسيق الرد الإلزامي:
      [التشخيص]: (اسم المشكلة)
      [السبب المحتمل]: (لماذا حدث العطل)
      [القطعة المطلوبة]: (اسم قطعة الغيار)
      [نصيحة المهندس]: (نصيحة فنية للمستخدم)
    `;

    try {
      let payload;
      if (selectedImage) {
        payload = {
          contents: [{
            parts: [
              { text: systemInstruction + "\nالمستخدم أرفق صورة لعطل، حللها وقدم التقرير." },
              { inlineData: { mimeType: "image/png", data: selectedImage.split(',')[1] } }
            ]
          }]
        };
      } else {
        payload = {
          contents: [{
            parts: [{ text: systemInstruction + "\nعطل المستخدم هو: " + userInput }]
          }]
        };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // استخراج الكود للبحث في قاعدة البيانات المحلية (الاستبن)
      const codeMatch = aiText.match(/\[CODE:\s*(\w+)\]/) || userInput.match(/P\d{4}/i);
      const targetCode = codeMatch ? (codeMatch[1] || codeMatch[0]) : null;

      // البحث في قاعدة بيانات الـ 1000 عطل
      let matchedDBEntry = null;
      if (targetCode) {
        matchedDBEntry = faultsDatabase.find(f => f.code.toUpperCase() === targetCode.toUpperCase());
      } else {
        // بحث بالكلمات المفتاحية كخيار بديل
        matchedDBEntry = faultsDatabase.find(f => aiText.includes(f.part) || userInput.includes(f.part));
      }
      setDbMatch(matchedDBEntry);

      setAiResponse({
        diagnosis: aiText.match(/\[التشخيص\]:(.*)/)?.[1] || "تحليل تقني",
        cause: aiText.match(/\[السبب المحتمل\]:(.*)/)?.[1] || "جاري فحص مسببات العطل",
        part: aiText.match(/\[القطعة المطلوبة\]:(.*)/)?.[1] || "غير محدد بدقة",
        tip: aiText.match(/\[نصيحة المهندس\]:(.*)/)?.[1] || "يفضل الفحص اليدوي للتأكيد"
      });

      setIsAnalyzing(false);
      setView('result');
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setView('home');
    }
  };

  // IoT Live Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIotStats(prev => ({
        ...prev,
        temp: 89 + Math.floor(Math.random() * 5),
        fuel: prev.fuel > 0 ? prev.fuel - 0.01 : 0
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-600/30 overflow-x-hidden relative" dir="rtl">
      
      {/* Background Lighting Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-25">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      {/* --- Premium Header --- */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-blue-500/30 shadow-lg shadow-blue-500/20 rotate-3 transition-all hover:rotate-0 hover:scale-110">
            <img src="image_8b76bb.jpg" alt="CAR_DOC Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-none tracking-tighter uppercase italic flex items-center gap-1">
              CAR<span className="text-blue-500">_DOC</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[7px] text-blue-400 font-bold uppercase tracking-[0.3em] animate-pulse">Neural Hybrid Engine</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setView('home')} className="bg-slate-800/40 p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg active:scale-90">
                <Settings className="w-5 h-5" />
            </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-36">

        {/* --- VIEW: HOME (The Command Center) --- */}
        {view === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-1000">
            
            {/* IoT Dashboard Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#020617] to-slate-800 rounded-[3rem] p-8 border border-white/10 shadow-2xl border-l-blue-600/50 border-l-4">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Gauge className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <span className="bg-blue-600/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                      Telemetry Active
                    </span>
                    <ShieldCheck className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <h2 className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-widest text-right">كفاءة المنظومة الرقمية</h2>
                <div className="flex items-baseline gap-3 justify-end">
                  <div className="flex flex-col items-end">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-widest italic">Optimal</span>
                    <span className="text-slate-600 text-[10px] font-bold tracking-tight">نظام مستقر</span>
                  </div>
                  <span className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{iotStats.health}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <div className="bg-white/5 p-6 rounded-[2.2rem] border border-white/5 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                    <Thermometer className="w-8 h-8 text-orange-500 group-hover:scale-125 transition-transform duration-500" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-black uppercase tracking-tighter">Engine Temp</span>
                      <span className="text-2xl font-black text-white tracking-tighter">{iotStats.temp}°C</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-[2.2rem] border border-white/5 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                    <Droplets className="w-8 h-8 text-blue-500 group-hover:scale-125 transition-transform duration-500" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-black uppercase tracking-tighter">Fuel Level</span>
                      <span className="text-2xl font-black text-white tracking-tighter">{Math.round(iotStats.fuel)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Input Hub */}
            <section className="bg-slate-900/40 p-1.5 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="bg-[#020617]/60 rounded-[3.3rem] p-8 space-y-8">
                  <h3 className="text-center font-black text-xl text-blue-100 flex items-center justify-center gap-3 italic">
                    <Zap className="w-6 h-6 text-yellow-500 animate-pulse" /> ابدأ الفحص الهجين (AI + Data)
                  </h3>

                  <div className="flex justify-center gap-3">
                    {[
                      { id: 'vision', label: 'رؤية AI', icon: Camera },
                      { id: 'text', label: 'وصف طبيعي', icon: MessageSquare },
                      { id: 'voice', label: 'تحليل صوتي', icon: Mic }
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => setInputType(type.id)} 
                        className={`flex-1 py-5 rounded-[2.2rem] flex flex-col items-center gap-2 border transition-all duration-500 ${inputType === type.id ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-105' : 'bg-slate-800/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
                      >
                        <type.icon className="w-7 h-7" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    {inputType === 'text' && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <textarea 
                          placeholder="اوصف العطل بلهجتك.. مثلاً: 'العربية بتنتش معايا في السلانسيه وريحة بنزين من الشكمان'"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 min-h-[180px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-white font-medium placeholder:text-slate-700 shadow-inner text-right leading-relaxed"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                        />
                        <button onClick={handleDiagnosticAction} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4 active:scale-95 transition-all">
                          تحليل الذكاء والبيانات <BrainCircuit className="w-8 h-8" />
                        </button>
                      </div>
                    )}

                    {inputType === 'voice' && (
                      <div className="py-14 flex flex-col items-center justify-center space-y-8 animate-in zoom-in bg-slate-900/20 rounded-[3.5rem] border border-white/5">
                        <button 
                          onClick={startVoiceCapture}
                          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.5)]' : 'bg-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-110'}`}
                        >
                          {isListening ? <MicOff className="w-12 h-12 text-white animate-pulse" /> : <Mic className="w-12 h-12 text-white" />}
                          {isListening && <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></div>}
                        </button>
                        <div className="text-center px-10 space-y-3">
                          <p className="text-white font-black text-2xl tracking-tight">{isListening ? "جاري الاستماع لصوتك..." : "اضغط للتحدث"}</p>
                          <p className="text-slate-500 text-xs leading-relaxed italic font-medium">{userInput || "اشرح العطل بصوتك وسأقوم بمطابقته مع 1,000+ حالة مسجلة فوراً"}</p>
                        </div>
                        {userInput && !isListening && (
                          <button onClick={handleDiagnosticAction} className="bg-blue-600 text-white px-14 py-4 rounded-full font-black shadow-2xl hover:bg-blue-500 transition-all active:scale-95">تحليل ما قلته هجينياً</button>
                        )}
                      </div>
                    )}

                    {inputType === 'vision' && (
                      <div className="py-14 flex flex-col items-center justify-center border-4 border-dashed border-slate-800/50 rounded-[3.5rem] animate-in zoom-in bg-slate-900/20 group">
                        {selectedImage ? (
                          <div className="relative w-full px-10">
                             <img src={selectedImage} alt="Captured Part" className="w-full h-80 object-cover rounded-[3rem] border border-white/10 shadow-2xl transition-transform hover:scale-[1.02]" />
                             <button onClick={() => setSelectedImage(null)} className="absolute -top-4 -right-4 bg-red-600 p-3 rounded-full shadow-2xl border-2 border-slate-900 transition-transform active:scale-75"><X className="w-5 h-5 text-white" /></button>
                             <button onClick={handleDiagnosticAction} className="w-full mt-8 bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl shadow-blue-600/40 hover:bg-blue-500 transition-all">تحليل الصورة ذكياً</button>
                          </div>
                        ) : (
                          <>
                            <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-blue-500/20 rotate-6 group-hover:rotate-0 transition-all duration-500">
                              <Camera className="w-12 h-12 text-blue-500" />
                            </div>
                            <p className="text-slate-400 font-black mb-10 text-center text-sm px-14 leading-relaxed">ارفع صورة لمكان العطل ليقوم الـ AI بمطابقتها مع قاعدة بيانات "أحمد شاذلي" في مصر</p>
                            <label className="bg-slate-800/80 hover:bg-slate-700 text-white px-12 py-5 rounded-[2rem] font-black text-xs border border-white/5 cursor-pointer transition-all shadow-2xl active:scale-95">
                              فتح معرض الصور
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>
               </div>
            </section>
          </div>
        )}

        {/* --- VIEW: SCANNING (Processing) --- */}
        {view === 'scanning' && (
          <div className="py-24 flex flex-col items-center justify-center space-y-14 animate-in fade-in duration-500">
            <div className="relative w-80 h-80">
               <div className="absolute inset-0 border-[10px] border-blue-500/5 rounded-full shadow-[0_0_60px_rgba(59,130,246,0.1)]"></div>
               <div className="absolute inset-0 border-[10px] border-blue-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Cpu className="w-24 h-24 text-blue-500 animate-pulse drop-shadow-[0_0_25px_rgba(59,130,246,0.7)]" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse"></div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-black mt-8 uppercase tracking-[0.6em]">Analyzing Core</span>
               </div>
               <div className="absolute top-0 bottom-0 left-0 right-0 h-1 bg-blue-400/50 blur-[8px] animate-[bounce_2.5s_infinite]"></div>
            </div>
            <div className="text-center space-y-10 w-full px-8">
              <h3 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-lg">Diagnostic Intelligence In Progress</h3>
              <div className="bg-[#020617] rounded-[3rem] p-8 text-right h-64 overflow-y-auto space-y-5 border border-white/5 shadow-inner custom-scrollbar">
                {scanLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,1)]"></div>
                    <p className="text-xs font-mono text-blue-300 opacity-90 leading-relaxed font-bold tracking-tight">{log}</p>
                  </div>
                ))}
                <div className="flex gap-2 items-center px-6 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: RESULT (The Hybrid Master Report) --- */}
        {view === 'result' && aiResponse && (
          <div className="space-y-8 animate-in slide-in-from-left duration-1000 pb-24">
             <button onClick={() => setView('home')} className="flex items-center gap-3 text-blue-400 font-black text-sm bg-blue-500/10 px-8 py-4 rounded-full w-fit border border-blue-500/20 hover:bg-blue-500/20 transition-all shadow-lg active:scale-95">
               <ChevronLeft className="w-5 h-5 rotate-180" /> ابدأ فحصاً جديداً
            </button>

            <div className="space-y-8">
                {/* 1. AI Analysis Section */}
                <div className="bg-gradient-to-br from-slate-900 to-[#020617] p-10 rounded-[4rem] border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.04] pointer-events-none rotate-12 scale-150">
                        <BrainCircuit className="w-80 h-80 text-blue-500" />
                    </div>
                    <div className="relative z-10 text-right">
                        <div className="flex justify-between items-start mb-12">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-5 py-2.5 rounded-2xl block uppercase tracking-widest shadow-2xl shadow-blue-600/50 italic">تقرير التحليل الرقمي (AI)</span>
                            <div className="bg-slate-800 p-4 rounded-2xl border border-white/5 shadow-xl"><Lightbulb className="w-7 h-7 text-blue-500" /></div>
                        </div>
                        
                        <div className="space-y-4 mb-12 border-r-4 border-blue-500 pr-8">
                          <h4 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] italic">الاستنتاج العصبي النهائي</h4>
                          <p className="text-4xl font-black text-white leading-tight drop-shadow-2xl">{aiResponse.diagnosis}</p>
                        </div>

                        <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 backdrop-blur-3xl mb-8 shadow-inner">
                            <span className="text-[10px] text-slate-500 block font-black mb-4 uppercase tracking-widest text-right">مسببات العطل المحتملة</span>
                            <p className="text-sm font-bold text-slate-200 leading-relaxed text-right italic">{aiResponse.cause}</p>
                        </div>

                        <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center gap-4 justify-end">
                          <p className="text-xs font-bold text-blue-300 text-right italic leading-relaxed">💡 نصيحة CAR_DOC: {aiResponse.tip}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Database Section (Match from Shazli's 1000+ Records) */}
                {dbMatch ? (
                  <div className="bg-[#0f172a] p-10 rounded-[4rem] border border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.06] pointer-events-none scale-150 text-emerald-500 rotate-[-15deg]">
                          <Layers className="w-80 h-80" />
                      </div>
                      <div className="relative z-10 text-right">
                          <div className="flex justify-between items-center mb-10">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 shadow-emerald-500 shadow-sm" />
                                <span className="bg-emerald-600 text-white text-[10px] font-black px-5 py-2.5 rounded-2xl block uppercase tracking-widest shadow-2xl shadow-emerald-600/50 italic">بيانات سوق أحمد شاذلي الموثقة</span>
                              </div>
                              <div className="bg-slate-800 p-4 rounded-2xl border border-white/5 shadow-xl"><Activity className="w-7 h-7 text-emerald-500" /></div>
                          </div>

                          <div className="grid grid-cols-2 gap-6 mb-10">
                              <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 text-right flex flex-col justify-center shadow-inner group hover:bg-white/10 transition-all">
                                  <span className="text-[10px] text-slate-500 block font-black mb-4 uppercase tracking-widest">متوسط سعر القطعة الآن</span>
                                  <span className="text-3xl font-black text-white italic tracking-tighter group-hover:text-emerald-400 transition-colors">{dbMatch.price} ج.م</span>
                              </div>
                              <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 text-right flex flex-col justify-center shadow-inner group hover:bg-white/10 transition-all">
                                  <span className="text-[10px] text-slate-500 block font-black mb-4 uppercase tracking-widest">تكلفة المصنعية المتوقعة</span>
                                  <span className="text-3xl font-black text-white italic tracking-tighter group-hover:text-emerald-400 transition-colors">{dbMatch.labor} ج.م</span>
                              </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-4 justify-end group cursor-default">
                               <span className="text-base font-black text-slate-200 group-hover:text-blue-400 transition-colors">القطعة المحددة: {dbMatch.part}</span>
                               <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5"><Hammer className="w-6 h-6 text-slate-500" /></div>
                            </div>
                            <div className="flex items-center gap-4 justify-end text-emerald-400 group cursor-default">
                               <span className="text-base font-black italic tracking-tight">أماكن التوفر: {dbMatch.source} ومحيطها</span>
                               <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10"><MapPin className="w-6 h-6" /></div>
                            </div>
                          </div>
                      </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 p-12 rounded-[4rem] border border-white/5 text-center shadow-2xl">
                    <Info className="w-12 h-12 text-blue-500/30 mx-auto mb-6 animate-pulse" />
                    <p className="text-slate-400 text-base font-bold leading-relaxed px-10">تم التحليل تقنياً، لكن العطل لم يتطابق بنسبة 100% مع "استبن" الأسعار في مصر. نعتمد حالياً على تقدير الـ AI للحل البرمجي.</p>
                  </div>
                )}

                {/* Final Connect Button */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-10 rounded-[3.5rem] flex justify-between items-center shadow-[0_20px_60px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="space-y-2 text-right relative z-10">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">AI-Linked Expert Service</p>
                        <span className="text-3xl font-black text-white drop-shadow-lg tracking-tight">تواصل مع أقرب فني معتمد ⚡</span>
                    </div>
                    <div className="bg-white/20 p-6 rounded-[2rem] shadow-2xl group-hover:bg-white/30 transition-all relative z-10">
                      <Navigation className="w-10 h-10 text-white group-hover:-translate-y-2 group-hover:translate-x-2 transition-transform duration-500" />
                    </div>
                </div>
            </div>
          </div>
        )}

      </main>

      {/* --- Smart Navigation Dock --- */}
      <nav className="fixed bottom-8 left-6 right-6 z-50">
        <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex justify-around items-center border-t-white/10">
          <button onClick={() => setView('home')} className={`p-5 rounded-[2.5rem] transition-all duration-700 ${view === 'home' ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <Activity className="w-7 h-7" />
          </button>
          <button className="p-5 rounded-[2.5rem] text-slate-500 hover:text-white transition-all"><Smartphone className="w-7 h-7" /></button>
          <button onClick={() => setShowDevInfo(true)} className="p-5 rounded-[2.5rem] bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner group relative overflow-hidden">
             <Info className="w-7 h-7 group-hover:rotate-[360deg] transition-transform duration-1000" />
             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          <button className="p-5 rounded-[2.5rem] text-slate-500 hover:text-white transition-all"><MapPin className="w-7 h-7" /></button>
        </div>
      </nav>

      {/* --- Founder Card Modal (The Ahmad Shazli Experience) --- */}
      {showDevInfo && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900 w-full max-w-sm rounded-[4rem] border border-blue-500/30 shadow-[0_0_120px_rgba(59,130,246,0.3)] relative overflow-hidden p-10 text-center space-y-10 border-t-blue-500/40">
              <button onClick={() => setShowDevInfo(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-all p-2 bg-white/5 rounded-full hover:rotate-90"><X className="w-6 h-6" /></button>
              
              <div className="relative inline-block mt-6 group">
                 <div className="w-48 h-48 rounded-[3.5rem] overflow-hidden border-[6px] border-blue-600 shadow-[0_0_50px_rgba(59,130,246,0.4)] relative z-10 mx-auto transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2">
                    <img src="IMG20251206123014 (2).jpg" alt="Founder Ahmad Shazli" className="w-full h-full object-cover object-top" />
                 </div>
                 <div className="absolute -inset-8 bg-blue-600/20 blur-[50px] rounded-full animate-pulse"></div>
                 <div className="absolute -bottom-4 -right-4 bg-blue-600 p-4 rounded-3xl shadow-2xl z-20 border-4 border-slate-900"><CheckCircle2 className="w-6 h-6 text-white" /></div>
              </div>

              <div className="space-y-3 relative">
                 <div className="relative inline-block group">
                    <h2 className="text-5xl font-black text-white tracking-tighter animate-smoke-effect cursor-default">Ahmad Shazli</h2>
                    <div className="absolute -top-12 left-0 w-full h-32 overflow-hidden pointer-events-none opacity-60">
                       <span className="smoke-item"></span>
                       <span className="smoke-item delay-1"></span>
                       <span className="smoke-item delay-2"></span>
                    </div>
                 </div>
                 <p className="text-blue-400 font-black text-[11px] uppercase tracking-[0.4em] italic drop-shadow-lg">CAR_DOC Founder & Chief Architect</p>
              </div>

              <div className="bg-white/[0.03] rounded-[3rem] p-8 border border-white/5 space-y-5 text-right shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex items-center gap-4 justify-end border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-slate-300">طالب في كلية الحاسبات والذكاء الاصطناعي</span>
                    <Cpu className="w-5 h-5 text-blue-500" />
                 </div>
                 <div className="flex items-center gap-4 justify-end group/item cursor-pointer">
                    <span className="text-[13px] font-black text-white tracking-widest group-hover/item:text-emerald-400 transition-colors">01505167066</span>
                    <Phone className="w-5 h-5 text-emerald-500 group-hover/item:scale-125 transition-transform" />
                 </div>
                 <div className="flex items-center gap-2 justify-center text-slate-600 pt-3 opacity-60">
                   <Heart className="w-4 h-4 fill-red-500/40 text-red-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Innovation for Egypt</span>
                 </div>
              </div>

              <div className="pt-2 opacity-50">
                 <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">مشغل بواسطة خوارزميات الذكاء الاصطناعي <br/> وبيانات <span className="text-blue-500 font-black">1,000+ عطل</span> موثقة.</p>
              </div>
           </div>
        </div>
      )}

      {/* --- Global Smoke & Luxury Styles --- */}
      <style>{`
        @keyframes smokeFlow {
          0% { transform: translateY(0) scale(1); opacity: 0; filter: blur(4px); }
          40% { opacity: 0.6; }
          100% { transform: translateY(-70px) scale(2.5); opacity: 0; filter: blur(20px); }
        }
        .animate-smoke-effect { text-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        .smoke-item { position: absolute; width: 30px; height: 30px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; bottom: 0; left: 50%; animation: smokeFlow 3s infinite ease-out; }
        .delay-1 { animation-delay: 0.8s; left: 30%; }
        .delay-2 { animation-delay: 1.8s; left: 70%; }
        
        /* Premium Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
        
        .selection\\:bg-blue-600\\/30 ::selection { background-color: rgba(37, 99, 235, 0.3); }
      `}</style>
    </div>
  );
}
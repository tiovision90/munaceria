import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot, 
  query, 
  deleteDoc, 
  writeBatch,
  addDoc,           // SUDAH DITAMBAHKAN
  orderBy,          // SUDAH DITAMBAHKAN
  serverTimestamp,  // SUDAH DITAMBAHKAN
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Moon, Sun, CheckCircle, XCircle, FileText, 
  LogOut, Shield, Users, Calendar, DollarSign, 
  ChevronRight, Save, AlertTriangle, Share2, 
  MessageSquare, Clock, BarChart3, TrendingUp,
  AlertCircle, ChevronDown, Filter, UserPlus, Trash2, MapPin, Heart, Star, X,
  Minus, Plus, Settings, Edit, Lock, ChevronLeft, LockKeyhole, RotateCcw, RefreshCcw, Info, KeyRound, Database, CheckCheck, Wallet
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBZiD1kXn3ibun-AmPlbFdmr_I26aIwdvM",
  authDomain: "munaceria2.firebaseapp.com",
  projectId: "munaceria2",
  storageBucket: "munaceria2.firebasestorage.app",
  messagingSenderId: "207274460765",
  appId: "1:207274460765:web:9bfd63bf914b2302846fb4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'munaceria'; // Bisa diganti nama unik lain


// --- HELPER: DATE UTILS ---
const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, days) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- DATA WARGA MUNA PERMAI 2 ---
const RAW_DATA = {
  "Gang Arjuno": [
    "Pak Deni", "Pak Igna", "Pak Anif", "Pak Rois", "Pak Eko", 
    "Pak Tafib", "Pak Anas", "Pak Adna", "Pak Slamet", "Pak Andri", 
    "Pak Findry", "Pak Agus", "Pak Khabib", "Pak Yarie", "Pak Dexa"
  ],
  "Gang Sadewo": [
    "Pak Noor", "Pak Hendro", "Pak Lutfi", "Pak Nafi", "Pak Riki", 
    "Pak Handi", "Pak Yoppi", "Pak Adi", "Pak Afendi", 
    "Pak Taufik" 
  ],
  "Gang Bimo & Yudhistira": [
    "Pak Riyan Hidayat", "Pak Dwi", "Ibu Zaetin", "Pak Riyan Bengkel", 
    "Pak Febri", "Pak Candra", "Pak Wawan", "Pak Susilo", 
    "Pak Rian Zulfikar", "Pak Yogo", "Pak Ali", "Pak Himawan", 
    "Pak Suekwan", 
    "Pak Andre",
    "Pak Marlan", 
    "Ibu Kustiah" 
  ]
};

const generateHouses = () => {
  const houses = [];
  let counter = 1;
  
  Object.keys(RAW_DATA).forEach(gang => {
    RAW_DATA[gang].forEach(name => {
      houses.push({
        id: `H${counter}`,
        number: `No. ${counter}`, 
        name: name,
        gang: gang,
      });
      counter++;
    });
  });
  return houses;
};

const HOUSES = generateHouses();
const TOTAL_HOUSES = HOUSES.length;
const JIMPITAN_VALUE = 500;

// --- DATA HISTORIS (FIXED 9 HARI: 12-20 JAN) ---
const HISTORICAL_LOGS = [
  // 12 Jan: Adna, Zaetin KOSONG
  { date: '2026-01-12', officers: ["Pak Deni", "Pak Igna"], gang: 'Gang Arjuno', missedNames: ["Pak Adna", "Ibu Zaetin"] }, 
  // 13 Jan: Kustiah KOSONG
  { date: '2026-01-13', officers: ["Pak Anif", "Pak Rois"], gang: 'Gang Arjuno', missedNames: ["Ibu Kustiah"] },
  // 14 Jan: Kustiah KOSONG
  { date: '2026-01-14', officers: ["Pak Eko", "Pak Tafib"], gang: 'Gang Arjuno', missedNames: ["Ibu Kustiah"] },
  // 15 Jan: Zaetin KOSONG
  { date: '2026-01-15', officers: ["Pak Anas", "Pak Adna"], gang: 'Gang Arjuno', missedNames: ["Ibu Zaetin"] },
  // 16 Jan: Adna KOSONG
  { date: '2026-01-16', officers: ["Pak Slamet", "Pak Andri"], gang: 'Gang Arjuno', missedNames: ["Pak Adna"] },
  // 17 Jan: Adna KOSONG
  { date: '2026-01-17', officers: ["Pak Findry", "Pak Agus"], gang: 'Gang Arjuno', missedNames: ["Pak Adna"] },
  // 18 Jan: Adna KOSONG
  { date: '2026-01-18', officers: ["Pak Yarie", "Pak Khabib"], gang: 'Gang Arjuno', missedNames: ["Pak Adna"] },
  // 19 Jan: Adna, Zaetin KOSONG
  { date: '2026-01-19', officers: ["Pak Noor", "Pak Hendro"], gang: 'Gang Sadewo', missedNames: ["Pak Adna", "Ibu Zaetin"] },
  // 20 Jan: Riki KOSONG
  { date: '2026-01-20', officers: ["Pak Lutfi", "Pak Nafi"], gang: 'Gang Sadewo', missedNames: ["Pak Riki"] },
  
  // PREPAID DATA (Tgl 21-23)
  { date: '2026-01-21', officers: [], gang: '-', missedNames: [], prepaidNames: ["Pak Dexa", "Pak Findry", "Pak Susilo"] },
  { date: '2026-01-22', officers: [], gang: '-', missedNames: [], prepaidNames: ["Pak Dexa", "Pak Susilo"] },
  { date: '2026-01-23', officers: [], gang: '-', missedNames: [], prepaidNames: ["Pak Dexa"] },
];

// --- KOMPONEN UTAMA ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [lastView, setLastView] = useState('login');
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState([]);
  const [currentPatrolData, setCurrentPatrolData] = useState({});
  const [currentPrepaidData, setCurrentPrepaidData] = useState({});
  const [currentPatrolNote, setCurrentPatrolNote] = useState("");
  const [currentOfficers, setCurrentOfficers] = useState([]);
  const [customPasswords, setCustomPasswords] = useState({});
  
  const todayStr = getLocalTodayStr();

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const qLogs = query(collection(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const loadedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLogs(loadedLogs);
    });

    const pwdRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_config', 'passwords');
    const unsubPwd = onSnapshot(pwdRef, (docSnap) => {
        if (docSnap.exists()) {
            setCustomPasswords(docSnap.data());
        } else {
            setCustomPasswords({});
        }
    });

    // SEEDING DATA
    const seedData = async () => {
      const batch = writeBatch(db);
      let batchCount = 0;

      // 1. HAPUS DATA MASA DEPAN (21-25 Jan) yg mungkin salah format
      const badDates = ['2026-01-21', '2026-01-22', '2026-01-23', '2026-01-24', '2026-01-25'];
      for (const d of badDates) {
          batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', d));
          batchCount++;
      }

      // 2. SEED DATA HISTORIS & PREPAID
      for (const log of HISTORICAL_LOGS) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', log.date);
        
        const entries = {};
        const prepaid = {};
        let calculatedTotal = 0;
        
        const isPatrolDay = (log.officers && log.officers.length > 0);

        HOUSES.forEach(h => {
          const isMissed = log.missedNames && log.missedNames.some(missed => 
              h.name.toLowerCase().includes(missed.toLowerCase().replace('pak ', '').replace('ibu ', '').replace('mas ', ''))
          );
          
          const isPrepaid = log.prepaidNames && log.prepaidNames.some(p => 
              h.name.toLowerCase().includes(p.toLowerCase().replace('pak ', '').replace('ibu ', '').replace('mas ', ''))
          );

          if (isPrepaid) {
              prepaid[h.id] = true;
              entries[h.id] = 0;
          } else {
              if (!isPatrolDay) {
                  entries[h.id] = 0; 
              } else {
                  entries[h.id] = isMissed ? 0 : 1;
                  if (!isMissed) calculatedTotal += JIMPITAN_VALUE;
              }
          }
        });

        const finalTotal = isPatrolDay ? (log.totalAmount !== undefined ? log.totalAmount : calculatedTotal) : 0;

        batch.set(docRef, {
          date: log.date,
          timestamp: new Date(log.date).toISOString(),
          officers: log.officers || [],
          officerGang: log.gang || '-',
          entries: entries,
          prepaid: prepaid,
          totalAmount: finalTotal,
          missedHouses: log.missedNames || [],
          note: "Data Import Historis (Fixed)",
          houseCount: TOTAL_HOUSES,
          isSimulation: false 
        }, { merge: true });
        
        batchCount++;
      }
      
      if (batchCount > 0) {
          await batch.commit();
      }
    };
    
    seedData();

    return () => {
      unsubLogs();
      unsubPwd();
    };
  }, [user]);

  const handleCheckIn = (officersList) => {
    setCurrentOfficers(officersList);
    setView('dashboard');
  };

  const handleAdminClick = () => {
      setLastView(view);
      setView('admin');
  };

  const startPatrol = () => {
    const existingLog = logs.find(l => l.date === todayStr);

    let patrolData = {};
    let prepaidData = {};

    if (existingLog) {
      HOUSES.forEach(h => {
          const val = existingLog.entries[h.id];
          patrolData[h.id] = (typeof val === 'number') ? val : (val ? 1 : 0);
      });
      prepaidData = existingLog.prepaid || {};
      setCurrentPatrolNote(existingLog.note || "");
    } else {
      HOUSES.forEach(h => patrolData[h.id] = 0);
      setCurrentPatrolNote("");
    }

    setCurrentPatrolData(patrolData);
    setCurrentPrepaidData(prepaidData);
    setView('patrol');
  };

  const updateJimpitanCount = (houseId, delta) => {
    if (currentPrepaidData[houseId]) return; 
    setCurrentPatrolData(prev => {
        const currentVal = prev[houseId] || 0;
        const newVal = Math.max(0, currentVal + delta);
        return { ...prev, [houseId]: newVal };
    });
  };

  const handleSmartPayment = async (houseId, delta) => {
      if (delta === 1) {
          const currentMonthPrefix = todayStr.substring(0, 7); 
          
          const unpaidPastLog = logs
              .filter(l => 
                  l.date.startsWith(currentMonthPrefix) && 
                  l.date < todayStr && 
                  (!l.entries[houseId] || l.entries[houseId] === 0) &&
                  !l.prepaid?.[houseId] &&
                  l.officers && l.officers.length > 0 // Hanya cek hutang di hari kerja
              )
              .sort((a, b) => a.date.localeCompare(b.date))[0];

          if (unpaidPastLog) {
              const confirmPayDebt = confirm(`Warga ini memiliki tanggungan pada tanggal ${unpaidPastLog.date}.\n\nAlokasikan pembayaran untuk melunasi tanggal tersebut?`);
              
              if (confirmPayDebt) {
                  try {
                      const logRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', unpaidPastLog.date);
                      await updateDoc(logRef, {
                          [`entries.${houseId}`]: 1,
                          totalAmount: (unpaidPastLog.totalAmount || 0) + JIMPITAN_VALUE,
                          missedHouses: (unpaidPastLog.missedHouses || []).filter(name => {
                              const house = HOUSES.find(h => h.id === houseId);
                              return name !== house?.name;
                          })
                      });
                      alert(`✅ Pembayaran dialokasikan untuk melunasi tanggal ${unpaidPastLog.date}.`);
                      return; 
                  } catch (e) {
                      console.error("Gagal update hutang", e);
                      alert("Gagal mengupdate data hutang.");
                  }
              }
          }
      }

      if (currentPrepaidData[houseId]) return; 
      
      setCurrentPatrolData(prev => {
          const currentVal = prev[houseId] || 0;
          const newVal = Math.max(0, currentVal + delta);
          return { ...prev, [houseId]: newVal };
      });
  };

  const savePatrol = async () => {
    if (!user) return;
    
    const existingLog = logs.find(l => l.date === todayStr);
    
    let finalOfficers = currentOfficers.map(o => o.name);
    let finalGang = currentOfficers.length > 0 ? currentOfficers[0].gang : '-';

    if (existingLog && existingLog.officers && existingLog.officers.length > 0) {
        finalOfficers = existingLog.officers;
        finalGang = existingLog.officerGang;
    }

    const totalAmount = Object.values(currentPatrolData).reduce((sum, count) => sum + (count * JIMPITAN_VALUE), 0);
    
    const missedHouses = HOUSES.filter(h => {
        const count = currentPatrolData[h.id] || 0;
        const isPrepaid = currentPrepaidData[h.id];
        return count === 0 && !isPrepaid;
    }).map(h => h.name);

    const isSimulationMode = false;

    const logData = {
      date: todayStr,
      timestamp: new Date().toISOString(),
      officers: finalOfficers,
      officerGang: finalGang,
      entries: currentPatrolData,
      prepaid: currentPrepaidData, 
      totalAmount: totalAmount,
      missedHouses: missedHouses,
      note: currentPatrolNote,
      houseCount: TOTAL_HOUSES,
      isSimulation: isSimulationMode 
    };

    try {
      const batch = writeBatch(db);
      const todayRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', todayStr);
      batch.set(todayRef, logData, { merge: true });

      for (const house of HOUSES) {
          const count = currentPatrolData[house.id] || 0;
          if (count > 1) {
              const daysToPrepay = count - 1;
              for (let i = 1; i <= daysToPrepay; i++) {
                  const futureDate = addDays(todayStr, i);
                  const futureRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', futureDate);
                  
                  batch.set(futureRef, {
                      date: futureDate, 
                      prepaid: { [house.id]: true },
                      entries: { [house.id]: 0 }, 
                      totalAmount: 0,
                      officers: [],
                      missedHouses: [],
                      officerGang: '-',
                      note: '',
                      houseCount: TOTAL_HOUSES,
                      isSimulation: isSimulationMode 
                  }, { merge: true });
              }
          }
      }

      await batch.commit();
      alert(`Laporan tanggal ${todayStr} tersimpan!`);
      setView('dashboard');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan.');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Memuat Sistem...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      {view === 'login' && <LoginPage onCheckIn={handleCheckIn} onAdmin={handleAdminClick} allResidents={HOUSES} passwords={customPasswords} />}

      {view !== 'login' && view !== 'admin' && (
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden flex flex-col relative">
          <header className={`bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md z-10 sticky top-0`}>
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-white" />
              <h1 className="font-bold text-lg">Muna Permai 2</h1>
            </div>
            <button onClick={() => setView('login')} className="text-xs bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
              <LogOut size={12} /> Keluar
            </button>
          </header>

          <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
            {view === 'dashboard' && (
              <Dashboard 
                officers={currentOfficers} 
                onStart={startPatrol} 
                onReport={() => setView('report')}
                logs={logs}
                todayStr={todayStr}
              />
            )}

            {view === 'patrol' && (
              <PatrolScreen 
                houses={HOUSES} 
                data={currentPatrolData} 
                prepaid={currentPrepaidData}
                note={currentPatrolNote}
                setNote={setCurrentPatrolNote}
                onUpdateCount={handleSmartPayment}
                onSave={savePatrol}
                onCancel={() => setView('dashboard')}
                todayStr={todayStr}
              />
            )}

            {view === 'report' && <ReportScreen logs={logs} onBack={() => setView('dashboard')} />}
          </main>
        </div>
      )}

      {view === 'admin' && (
        <AdminScreen 
            logs={logs} 
            onBack={() => setView(lastView)} 
            appId={appId} 
            passwords={customPasswords}
        />
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function LoginPage({ onCheckIn, onAdmin, allResidents, passwords }) {
  const [selectedGang, setSelectedGang] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [officers, setOfficers] = useState([
    { id: '', password: '' },
    { id: '', password: '' }
  ]);

  const gangs = Object.keys(RAW_DATA);

  const availableResidents = useMemo(() => {
    if (!selectedGang) return [];
    return allResidents.filter(h => h.gang === selectedGang);
  }, [selectedGang, allResidents]);

  const updateOfficer = (index, field, value) => {
    const newOfficers = [...officers];
    newOfficers[index][field] = value;
    setOfficers(newOfficers);
  };

  const addOfficerSlot = () => {
    setOfficers([...officers, { id: '', password: '' }]);
  };

  const removeOfficerSlot = (index) => {
    const newOfficers = officers.filter((_, i) => i !== index);
    setOfficers(newOfficers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!selectedGang) {
        setErrorMsg('Mohon pilih Wilayah / Gang terlebih dahulu.');
        return;
    }

    const validOfficers = [];
    const officerIds = new Set(); 

    for (let i = 0; i < officers.length; i++) {
        const off = officers[i];
        if (!off.id) continue;

        if (!off.password) {
            setErrorMsg(`Password untuk petugas ke-${i+1} belum diisi!`);
            return;
        }

        const resident = availableResidents.find(h => h.id === off.id);
        if (!resident) {
            setErrorMsg('Data warga tidak valid.');
            return;
        }

        const correctPassword = passwords[resident.id] || '123'; 
        if (off.password !== correctPassword) {
            setErrorMsg(`Password SALAH untuk petugas "${resident.name}". \nSilakan coba lagi (Default: 123)`);
            return;
        }

        if (officerIds.has(resident.id)) {
            setErrorMsg(`Warga "${resident.name}" dipilih lebih dari satu kali.`);
            return;
        }
        officerIds.add(resident.id);

        validOfficers.push(resident);
    }

    if (validOfficers.length < 1) {
        setErrorMsg('Minimal ada 1 petugas yang check in.');
        return;
    }

    onCheckIn(validOfficers);
  };

  const handleGangChange = (gang) => {
      setSelectedGang(gang);
      setOfficers([
        { id: '', password: '' },
        { id: '', password: '' }
      ]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-800 to-slate-900 p-4 relative">
      
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-in zoom-in-95 duration-200">
             <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
               <XCircle size={32} className="text-rose-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Login Gagal</h3>
             <p className="text-sm text-slate-600 mb-6 whitespace-pre-line leading-relaxed">{errorMsg}</p>
             <button 
               onClick={() => setErrorMsg('')}
               className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
             >
               Tutup & Perbaiki
             </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
        {/* Tombol Admin di dalam Card (Pojok Kanan Atas Area Putih) */}
        <button 
            onClick={onAdmin}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            title="Menu Admin"
        >
            <Settings size={20} />
        </button>

        <div className="flex justify-center mb-4 text-emerald-600"><Shield size={56} /></div>
        <h2 className="text-xl font-bold text-center text-slate-800">Jimpitan Muna Permai 2</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">Sistem Pencatatan Digital</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                  <MapPin size={12} /> PILIH GANG PETUGAS
              </label>
              <div className="relative">
                <select 
                    className="w-full p-2.5 text-sm font-semibold border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700"
                    value={selectedGang}
                    onChange={(e) => handleGangChange(e.target.value)}
                >
                    <option value="">-- Pilih Gang --</option>
                    {gangs.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
             <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Users size={12} /> Anggota Regu
              </label>
            {officers.map((officer, index) => (
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-bottom-2">
                 <div className="w-8 h-10 bg-emerald-100 rounded-lg text-emerald-700 flex items-center justify-center text-sm font-bold shadow-sm shrink-0 border border-emerald-200 mt-0.5">
                    {index + 1}
                 </div>
                 <div className="flex-1 space-y-2">
                    <div className="relative">
                        <select 
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg appearance-none bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={officer.id}
                            onChange={(e) => updateOfficer(index, 'id', e.target.value)}
                            disabled={!selectedGang}
                        >
                            <option value="">{selectedGang ? "-- Pilih Nama --" : "-- Pilih Gang Dulu --"}</option>
                            {availableResidents.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                    <input 
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                        value={officer.password}
                        onChange={(e) => updateOfficer(index, 'password', e.target.value)}
                        disabled={!officer.id}
                    />
                 </div>
                 {officers.length > 1 && (
                     <button type="button" onClick={() => removeOfficerSlot(index)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                     </button>
                 )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addOfficerSlot} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
             <UserPlus size={16} /> Tambah Anggota
          </button>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
            Masuk / Check In <ChevronRight size={18} />
          </button>
        </form>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 italic">
             <Heart size={12} className="fill-rose-400 text-rose-400 animate-pulse" />
             <span>Powered by Mas Yogo with love</span>
             <Heart size={12} className="fill-rose-400 text-rose-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ officers, onStart, onReport, logs, todayStr }) {
  const todayLog = logs.find(l => l.date === todayStr);
  const todayIncome = todayLog?.totalAmount || 0;
  const isPatrolDone = logs.some(l => l.date === todayStr);
  
  const currentMonth = new Date(todayStr).getMonth();
  const currentYear = new Date(todayStr).getFullYear();
  const monthlyLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyIncome = monthlyLogs.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const displayDate = new Date(todayStr).toLocaleDateString('id-ID', dateOptions);

  const topMissed = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
        if (log.missedHouses && Array.isArray(log.missedHouses)) {
            log.missedHouses.forEach(name => {
                counts[name] = (counts[name] || 0) + 1;
            });
        }
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) 
        .slice(0, 5);
  }, [logs]);

  // --- CEK APAKAH SUDAH ADA LAPORAN & OTORISASI EDIT ---
  const activeReport = logs.find(l => l.date === todayStr && l.officers && l.officers.length > 0);
  
  const isAuthorized = useMemo(() => {
    if (!activeReport) return true; // Belum ada laporan, siapa saja boleh buat
    // Cek apakah salah satu petugas yang login saat ini ada di daftar petugas pembuat laporan
    const currentNames = officers.map(o => o.name);
    const reportNames = activeReport.officers || [];
    return currentNames.some(name => reportNames.includes(name));
  }, [activeReport, officers]);

  return (
    <div className="p-4 space-y-6">

      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Selamat Bertugas</p>
                <h2 className="text-2xl font-bold">Halo, Petugas!</h2>
             </div>
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10">
                <Shield size={24} className="text-white" />
             </div>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4">
             <div className="flex items-center gap-2 text-emerald-100 text-xs mb-1">
                <Calendar size={12} />
                <span>{displayDate}</span>
             </div>
             <div className="flex items-start gap-2 mt-2">
                <Users size={14} className="text-emerald-200 mt-1 shrink-0" />
                <div className="text-sm font-semibold flex flex-wrap gap-1">
                    {officers.length > 0 ? officers.map((o, idx) => (
                        <span key={idx} className="bg-emerald-800/50 px-2 py-0.5 rounded text-xs border border-emerald-500/30">
                            {o.name}
                        </span>
                    )) : <span className="text-xs text-white/50 italic">Belum Check In</span>}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- WARNING JIKA LAPORAN SUDAH ADA --- */}
      {activeReport && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2">
             <div className="flex items-start gap-3">
                <Info className="text-amber-500 shrink-0" size={20} />
                <div>
                   <h3 className="font-bold text-amber-800 text-sm">Laporan Hari Ini Sedang Aktif</h3>
                   <p className="text-xs text-amber-600 mt-1">
                      Laporan dibuat oleh: <span className="font-semibold text-amber-700">{activeReport.officers.join(', ')}</span>.
                   </p>
                   {!isAuthorized && (
                       <p className="text-[10px] text-rose-500 mt-2 font-bold italic">
                          Anda tidak memiliki akses untuk mengedit laporan ini karena petugas berbeda.
                       </p>
                   )}
                </div>
             </div>
          </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* BOX HARI INI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-auto min-h-[7rem]">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
                <Clock size={12} className="text-emerald-500" /> Hari Ini
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-800 break-words leading-tight">
                  Rp {todayIncome.toLocaleString('id-ID')}
              </div>
              <div className={`text-[10px] sm:text-xs mt-1 font-medium ${isPatrolDone ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {isPatrolDone ? '✔ Sudah dicatat' : '⚠ Belum input'}
              </div>
            </div>
        </div>

        {/* BOX BULAN INI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-auto min-h-[7rem]">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
                <TrendingUp size={12} className="text-blue-500" /> Bulan Ini
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-800 break-words leading-tight">
                  Rp {monthlyIncome.toLocaleString('id-ID')}
              </div>
               <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  Total terkumpul
              </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tombol Mulai/Edit Patroli dengan Logika Lock */}
        <button 
            onClick={isAuthorized ? onStart : () => alert("Akses Ditolak! Hanya petugas yang membuat laporan ini yang dapat mengedit.")}
            className={`p-5 rounded-3xl shadow-sm border transition-all flex flex-col items-center gap-3 ${
            !isAuthorized 
                ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70' // Locked style
                : isPatrolDone 
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100' 
                : 'bg-white border-slate-100 hover:border-emerald-500 hover:shadow-md'
            }`}
        >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
            !isAuthorized ? 'bg-slate-300 text-white' :
            isPatrolDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-100 text-emerald-600'
            }`}>
            {!isAuthorized ? <Lock size={24} /> : isPatrolDone ? <CheckCircle size={28} /> : <Moon size={28} />}
            </div>
            <span className={`font-semibold text-center ${
            !isAuthorized ? 'text-slate-400' : isPatrolDone ? 'text-emerald-700' : 'text-slate-700'
            }`}>
            {!isAuthorized ? 'Laporan Terkunci' : isPatrolDone ? 'Edit Laporan' : 'Mulai Patroli'}
            </span>
        </button>

        <button onClick={onReport} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 size={28} />
          </div>
          <span className="font-semibold text-slate-700">Analisis & Laporan</span>
        </button>
      </div>

      {/* --- Top 5 Warga Sering Kosong (Restored) --- */}
      {topMissed.length > 0 && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <AlertCircle size={16} className="text-rose-500" /> Warga Sering Kosong
               </h3>
               <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Top 5</span>
           </div>
           
           <div className="space-y-3">
             {topMissed.map(([name, count], index) => (
                <div key={name} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${index === 0 ? 'bg-rose-500' : 'bg-slate-300'}`}>
                            {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">{count}x</span>
                       <span className="text-[10px] text-rose-400">kosong</span>
                    </div>
                </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}

function AdminScreen({ logs, onBack, appId, passwords }) {
    const [auth, setAuth] = useState(false);
    const [pin, setPin] = useState('');
    const [editLog, setEditLog] = useState(null);
    const [viewMode, setViewMode] = useState('list'); 
    
    // State untuk Modal Hapus Kustom
    const [deletingLogId, setDeletingLogId] = useState(null);

    const checkAuth = (e) => {
        e.preventDefault();
        if (pin === '59321') {
            setAuth(true);
        } else {
            alert('PIN Salah!');
        }
    };

    // Fungsi trigger modal hapus
    const confirmDelete = (logId) => {
        setDeletingLogId(logId);
    };
    
    // Fungsi eksekusi hapus di database
    const executeDelete = async () => {
        if (!deletingLogId) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', deletingLogId));
            setDeletingLogId(null);
        } catch (e) {
            console.error(e);
            alert('Gagal menghapus data.');
        }
    };

    const handleSaveEdit = async (data) => {
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', data.date), data);
            alert('Perubahan berhasil disimpan!');
            setEditLog(null);
            setViewMode('list');
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan.');
        }
    }

    if (!auth) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full">
                <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-500">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold mb-4 text-slate-700">Akses Admin</h2>
                <form onSubmit={checkAuth} className="w-full max-w-xs space-y-4">
                    <input 
                        type="password" 
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="Masukkan PIN"
                        className="w-full p-3 border border-slate-300 rounded-xl text-center text-lg tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Buka</button>
                    <button type="button" onClick={onBack} className="w-full text-slate-500 text-sm">Kembali</button>
                </form>
            </div>
        );
    }
    
    if (viewMode === 'password') {
        return <PasswordManager appId={appId} currentPasswords={passwords} onBack={() => setViewMode('list')} />;
    }

    if (viewMode === 'edit' && editLog) {
        return (
            <AdminEditor 
                log={editLog} 
                onSave={handleSaveEdit} 
                onCancel={() => { setEditLog(null); setViewMode('list'); }} 
            />
        );
    }

    return (
        <div className="p-4 flex flex-col h-full bg-slate-50 relative">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={24} className="rotate-180" /></button>
                <h2 className="text-xl font-bold text-slate-800">Panel Admin</h2>
            </div>
            
            <button 
                onClick={() => setViewMode('password')}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-6 hover:bg-slate-700 shadow-lg"
            >
                <KeyRound size={18} /> Manajemen Password Warga
            </button>

            <div className="space-y-3 overflow-y-auto">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-2">Data Tersimpan</h3>
                {logs.map(log => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <div className="font-bold text-slate-700 flex items-center gap-2">
                                <Calendar size={14} className="text-emerald-500" />
                                {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {(log.officers || []).join(', ')} • Rp {(log.totalAmount || 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditLog(log); setViewMode('edit'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => confirmDelete(log.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- CUSTOM DELETE MODAL --- */}
            {deletingLogId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data?</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Anda yakin ingin menghapus laporan tanggal <strong>{deletingLogId}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeletingLogId(null)}
                                className="flex-1 py-3 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeDelete}
                                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PasswordManager({ appId, currentPasswords, onBack }) {
    const [passwords, setPasswords] = useState(currentPasswords || {});
    const [hasChanges, setHasChanges] = useState(false);

    const residentsByGang = useMemo(() => {
        const grouped = {};
        HOUSES.forEach(h => {
            if (!grouped[h.gang]) grouped[h.gang] = [];
            grouped[h.gang].push(h);
        });
        return grouped;
    }, []);

    const handleChange = (id, val) => {
        setPasswords(prev => ({ ...prev, [id]: val }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_config', 'passwords'), passwords);
            alert('Password berhasil diperbarui!');
            setHasChanges(false);
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan password.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Manajemen Password</h2>
                <button onClick={onBack} className="text-sm text-slate-500 font-bold">Kembali</button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto pb-40">
                {Object.entries(residentsByGang).map(([gangName, residents]) => (
                    <div key={gangName} className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 border-b pb-1">{gangName}</h3>
                        {residents.map((house) => (
                            <div key={house.id} className="flex items-center justify-between py-1">
                                <span className="text-sm font-medium text-slate-700 w-1/2">{house.name}</span>
                                <input 
                                    type="text" 
                                    className="w-1/2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500"
                                    placeholder="123"
                                    value={passwords[house.id] || ''}
                                    onChange={(e) => handleChange(house.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
                <button 
                    onClick={handleSave} 
                    disabled={!hasChanges}
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all ${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                    Simpan Perubahan
                </button>
            </div>
        </div>
    );
}

// ... existing AdminEditor, PatrolScreen, ReportScreen, ResidentCalendarModal ...
function AdminEditor({ log, onSave, onCancel }) {
    const [data, setData] = useState(log.entries || {});
    const [prepaid, setPrepaid] = useState(log.prepaid || {});
    const [officers, setOfficers] = useState((log.officers || []).join(', '));
    const [gang, setGang] = useState(log.officerGang || '-');
    const [note, setNote] = useState(log.note || '');

    const residentsByGang = useMemo(() => {
        const grouped = {};
        HOUSES.forEach(h => {
            if (!grouped[h.gang]) grouped[h.gang] = [];
            grouped[h.gang].push(h);
        });
        return grouped;
    }, []);

    const updateCount = (houseId, delta) => {
        // If prepaid is set, cannot edit count
        if (prepaid[houseId]) return;

        setData(prev => {
            const currentVal = prev[houseId] || 0;
            const newVal = Math.max(0, currentVal + delta);
            return { ...prev, [houseId]: newVal };
        });
    };

    const togglePrepaid = (houseId) => {
        setPrepaid(prev => {
            const newVal = !prev[houseId];
            const nextPrepaid = { ...prev, [houseId]: newVal };
            
            // If setting to prepaid, reset count to 0 (because prepaid logic)
            // If unsetting prepaid, count remains 0 until edited
            if (newVal) {
                setData(prevData => ({ ...prevData, [houseId]: 0 }));
            }
            return nextPrepaid;
        });
    };

    const handleSave = async () => {
        const batch = writeBatch(db);
        const totalAmount = Object.values(data).reduce((sum, count) => sum + (count * JIMPITAN_VALUE), 0);
        const missedHouses = HOUSES.filter(h => (!data[h.id] || data[h.id] === 0) && !prepaid[h.id]).map(h => h.name);
        
        const updatedLog = {
            ...log,
            officers: officers.split(',').map(s => s.trim()),
            officerGang: gang,
            entries: data,
            prepaid: prepaid,
            totalAmount,
            missedHouses,
            note
        };

        // 1. Save Current Log
        const currentRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', log.date);
        batch.set(currentRef, updatedLog, { merge: true });

        // 2. Handle Future Prepaid Generation (Sama seperti di App main)
        for (const house of HOUSES) {
            const count = data[house.id] || 0;
            if (count > 1) {
                const daysToPrepay = count - 1;
                for (let i = 1; i <= daysToPrepay; i++) {
                    const futureDate = addDays(log.date, i);
                    const futureRef = doc(db, 'artifacts', appId, 'public', 'data', 'jimpitan_logs', futureDate);
                    
                    batch.set(futureRef, {
                        date: futureDate,
                        timestamp: new Date(futureDate).toISOString(),
                        prepaid: { [house.id]: true },
                        entries: { [house.id]: 0 },
                        totalAmount: 0,
                        officers: [], 
                        missedHouses: [],
                        officerGang: '-',
                        note: '',
                        houseCount: TOTAL_HOUSES,
                        isSimulation: false 
                    }, { merge: true });
                }
            }
        }

        await batch.commit();
        onSave(updatedLog);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Edit Data</h2>
                <button onClick={onCancel} className="text-sm text-rose-500 font-bold">Batal</button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto pb-40">
                {/* ... (Officers, Gang, Note inputs same as before) ... */}
                 <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Petugas (Pisahkan Koma)</label>
                        <input type="text" className="w-full p-2 border rounded-lg text-sm" value={officers} onChange={e => setOfficers(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Asal Gang</label>
                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={gang} onChange={e => setGang(e.target.value)}>
                            <option value="-">-</option>
                            {Object.keys(RAW_DATA).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Catatan</label>
                        <textarea className="w-full p-2 border rounded-lg text-sm" rows="2" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                </div>


                {Object.entries(residentsByGang).map(([gangName, residents]) => (
                    <div key={gangName} className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase ml-1">{gangName}</h3>
                        {residents.map((house) => {
                            const count = data[house.id] || 0;
                            const isPrepaid = prepaid[house.id];
                            
                            return (
                                <div key={house.id} className={`flex items-center justify-between p-2 rounded-lg border bg-white ${isPrepaid ? 'border-sky-400 bg-sky-50' : count > 0 ? 'border-emerald-500' : 'border-slate-200'}`}>
                                    <span className="text-sm font-medium text-slate-700">{house.name}</span>
                                    <div className="flex items-center gap-2">
                                        {/* Tombol P (Prepaid Manual Toggle) */}
                                        <button 
                                            onClick={() => togglePrepaid(house.id)}
                                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${isPrepaid ? 'bg-sky-500 text-white border-sky-600' : 'bg-slate-100 text-slate-400 border-slate-300'}`}
                                            title="Set Prepaid Manual"
                                        >
                                            P
                                        </button>

                                        {!isPrepaid && (
                                            <>
                                                {count > 0 && <button onClick={() => updateCount(house.id, -1)} className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Minus size={12}/></button>}
                                                <span className={`text-sm font-bold w-6 text-center ${count > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{count}</span>
                                                <button onClick={() => updateCount(house.id, 1)} className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Plus size={12}/></button>
                                            </>
                                        )}
                                        {isPrepaid && <span className="text-xs font-bold text-sky-600 px-2">Prepaid</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
                <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Simpan Perubahan</button>
            </div>
        </div>
    );
}

function PatrolScreen({ houses, data, prepaid, note, setNote, onUpdateCount, onSave, onCancel, todayStr }) {
  const currentTotal = Object.values(data).reduce((sum, count) => sum + (count * 500), 0);

  const residentsByGang = useMemo(() => {
    const grouped = {};
    houses.forEach(h => {
        if (!grouped[h.gang]) grouped[h.gang] = [];
        grouped[h.gang].push(h);
    });
    return grouped;
  }, [houses]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Form Patroli</h2>
          <p className="text-xs text-slate-500">{new Date(todayStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="text-right bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Terkumpul</p>
           <p className="font-bold text-emerald-700 text-lg">Rp {currentTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-40">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                <MessageSquare size={16} /> Catatan Kejadian
            </label>
            <textarea 
                className="w-full p-3 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder:text-slate-400"
                rows="2"
                placeholder="Ada lampu mati? Pagar terbuka?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
        </div>

        {Object.entries(residentsByGang).map(([gangName, residents]) => (
            <div key={gangName} className="space-y-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1 mt-4 border-b border-slate-200 pb-1">{gangName}</h3>
                {residents.map((house) => {
                    const count = data[house.id] || 0;
                    const isPaid = count > 0;
                    const isPrepaid = prepaid[house.id];

                    return (
                        <div key={house.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${isPrepaid ? 'bg-blue-50 border-blue-300' : isPaid ? 'bg-white border-emerald-500 shadow-md shadow-emerald-100' : 'bg-slate-100 border-transparent opacity-75 hover:opacity-100 hover:bg-white hover:border-slate-300'}`}>
                        {/* Area Nama - Klik untuk +1 */}
                        <div 
                            onClick={() => !isPrepaid && onUpdateCount(house.id, 1)}
                            className={`flex items-center gap-3 flex-1 ${!isPrepaid ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${isPrepaid ? 'bg-blue-200 text-blue-700' : isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                {isPrepaid ? <LockKeyhole size={14} /> : house.id.replace('H','')}
                            </div>
                            <div>
                                <p className={`font-semibold text-sm ${isPrepaid ? 'text-blue-900' : isPaid ? 'text-emerald-900' : 'text-slate-600'}`}>{house.name}</p>
                                {isPrepaid && (
                                    <p className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                        Sudah Bayar (Prepaid)
                                    </p>
                                )}
                                {isPaid && !isPrepaid && (
                                    <p className="text-[10px] text-emerald-600 font-bold">
                                        Rp {(count * 500).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Kontrol Stepper (Hide if Prepaid) */}
                        {!isPrepaid && (
                            <div className="flex items-center gap-2">
                                {count > 0 && (
                                    <button 
                                        onClick={() => onUpdateCount(house.id, -1)}
                                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 active:scale-95 transition-transform"
                                    >
                                        <Minus size={16} />
                                    </button>
                                )}
                                
                                <div 
                                    onClick={() => onUpdateCount(house.id, 1)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                        count > 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' :
                                        count === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                                        'bg-slate-300 text-white'
                                    }`}
                                >
                                    {count > 0 ? <span className="font-bold">{count}x</span> : <Plus size={20} />}
                                </div>
                            </div>
                        )}
                        </div>
                    );
                })}
            </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 flex gap-3 max-w-md mx-auto z-20">
        <button onClick={onCancel} className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">Batal</button>
        <button onClick={onSave} className="flex-2 w-2/3 bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-2">
          <Save size={18} /> Simpan Laporan
        </button>
      </div>
    </div>
  );
}

function ReportScreen({ logs, onBack }) {
  const [activeTab, setActiveTab] = useState('history'); 
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [selectedResident, setSelectedResident] = useState(null); 

  const stats = useMemo(() => {
    const monthlyData = {}; 

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLogs.forEach(log => {
        const date = new Date(log.date);
        const monthKey = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                totalDays: 0,
                totalCollected: 0,
                residents: {},
                officerStats: {} 
            };
            
            HOUSES.forEach(h => {
                monthlyData[monthKey].residents[h.id] = {
                    id: h.id,
                    name: h.name,
                    paidAmount: 0,
                    debtAmount: 0,
                    extraAmount: 0 
                };
                monthlyData[monthKey].officerStats[h.name] = 0;
            });
        }

        // Logic: ONLY count totalDays if officers exist (real patrol day)
        if (log.officers && log.officers.length > 0) {
            monthlyData[monthKey].totalDays++;
        }

        if (log.entries) {
            HOUSES.forEach(h => {
                let count = 0;
                if (typeof log.entries[h.id] === 'number') {
                    count = log.entries[h.id];
                } else if (typeof log.entries[h.id] === 'boolean') {
                    count = log.entries[h.id] ? 1 : 0;
                }

                // Check Prepaid
                const isPrepaid = log.prepaid && log.prepaid[h.id];
                const rStats = monthlyData[monthKey].residents[h.id];
                
                if (count > 0) {
                    rStats.paidAmount += (count * JIMPITAN_VALUE);
                    monthlyData[monthKey].totalCollected += (count * JIMPITAN_VALUE);
                    
                    if (count > 1) {
                        rStats.extraAmount += (count - 1) * JIMPITAN_VALUE;
                    }
                } else if (isPrepaid) {
                    rStats.paidAmount += JIMPITAN_VALUE; 
                    monthlyData[monthKey].totalCollected += JIMPITAN_VALUE;
                    rStats.extraAmount += JIMPITAN_VALUE; 
                }
            });
        }

        if (log.officers && Array.isArray(log.officers)) {
            log.officers.forEach(officerName => {
                if (monthlyData[monthKey].officerStats[officerName] === undefined) {
                    monthlyData[monthKey].officerStats[officerName] = 0;
                }
                monthlyData[monthKey].officerStats[officerName]++;
            });
        }
    });

    Object.keys(monthlyData).forEach(key => {
        const m = monthlyData[key];
        const targetPerPerson = m.totalDays * JIMPITAN_VALUE;

        HOUSES.forEach(h => {
            const r = m.residents[h.id];
            const diff = r.paidAmount - targetPerPerson;

            if (diff < 0) {
                r.debtAmount = Math.abs(diff);
                r.extraAmount = 0; // If you have debt, you don't have extra
            } else {
                r.debtAmount = 0;
                // Extra is just diff (positive)
                r.extraAmount = diff;
            }
        });
    });

    const monthKeys = Object.keys(monthlyData);
    return { monthlyData, monthKeys };
  }, [logs]);

  useEffect(() => {
    if (stats.monthKeys.length > 0 && !selectedMonthKey) {
        setSelectedMonthKey(stats.monthKeys[0]);
    }
  }, [stats.monthKeys, selectedMonthKey]);

  const selectedStats = stats.monthlyData[selectedMonthKey];
  let monthlyTarget = 0;
  let remainingTarget = 0;

  if (selectedStats) {
      // Logic baru: Target Bulanan = Total Hari Patroli x Jumlah Warga x Nilai Jimpitan
      monthlyTarget = selectedStats.totalDays * TOTAL_HOUSES * JIMPITAN_VALUE;
      remainingTarget = monthlyTarget - selectedStats.totalCollected;
  }

  // ... copyToClipboard & formatWAMessage (kept same) ...
    const formatWAMessage = (log) => {
    const date = new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    const missed = log.missedHouses && log.missedHouses.length > 0 
        ? log.missedHouses.join(', ') 
        : '- Nihil -';
    
    const note = log.note ? log.note : '-';

    let gangName = log.officerGang;
    if (!gangName && log.officers && log.officers.length > 0) {
        const firstOfficerName = log.officers[0];
        const foundHouse = HOUSES.find(h => h.name === firstOfficerName);
        if (foundHouse) gangName = foundHouse.gang;
    }

    return `*LAPORAN JIMPITAN POSKAMLING*

📅 ${date}
👮 Petugas: ${(log.officers || []).join(' & ')}
📍 Dari: ${gangName || '-'}

💰 Perolehan: Rp ${(log.totalAmount || 0).toLocaleString()}

❌ Kosong : 
${missed}

📝 Catatan: ${note}

_Direkap via Aplikasi Muna Digital_`;
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert("Teks tersalin! Silakan tempel di WhatsApp.");
    } catch (err) {
      alert("Gagal menyalin.");
    }
    document.body.removeChild(textArea);
  };
  
  if (selectedResident && selectedStats) {
      const residentObj = HOUSES.find(h => h.id === selectedResident);
      return (
          <ResidentCalendarModal 
            resident={residentObj} 
            monthKey={selectedMonthKey}
            year={new Date().getFullYear()} // Default to current year for simplicity
            month={new Date().getMonth()}   // Default to current month
            logs={logs}
            onClose={() => setSelectedResident(null)}
          />
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={24} className="rotate-180" /></button>
            <h2 className="text-xl font-bold text-slate-800">Laporan & Data</h2>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full gap-1">
           <button 
             onClick={() => setActiveTab('history')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Riwayat
           </button>
           <button 
             onClick={() => setActiveTab('stats')}
             className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'stats' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Rekap Bulanan
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {!selectedStats ? (
               <div className="text-center py-10 text-slate-400">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  Belum ada data cukup untuk analisis.
               </div>
            ) : (
              <>
                <div className="relative">
                    <select 
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                    >
                        {stats.monthKeys.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-600">
                        <ChevronDown size={16} />
                    </div>
                </div>

                {/* --- TABEL KEAKTIFAN PETUGAS (BARU) --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={18} className="text-slate-500" /> Keaktifan Petugas
                        </h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(selectedStats.officerStats)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([name, count], idx) => (
                                        <tr key={name} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-medium text-slate-700 flex items-center gap-2">
                                                {idx < 3 && count > 0 && <span className="text-amber-500">👑</span>}
                                                {idx + 1}. {name}
                                            </td>
                                            <td className="p-3 text-right font-bold text-emerald-600">
                                                {count > 0 ? `${count}x Jaga` : <span className="text-slate-300 font-normal">0x</span>}
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Wallet size={18} className="text-slate-500" /> Rekap Keuangan Warga
                      </h3>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        Waktu: {selectedStats.totalDays} Hari
                      </span>
                   </div>
                   <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-1/3">Nama Warga</th>
                                    <th className="p-3 text-center">Total Setor</th>
                                    <th className="p-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.values(selectedStats.residents)
                                    .sort((a, b) => b.debtAmount - a.debtAmount) // Urutkan yang hutang paling banyak di atas
                                    .map((resident, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td 
                                        className="p-3 font-medium text-slate-700 cursor-pointer hover:text-blue-600 hover:bg-slate-100 transition-colors underline decoration-dotted decoration-slate-300 underline-offset-4"
                                        onClick={() => setSelectedResident(resident.id)}
                                    >
                                        {resident.name}
                                        <div className="text-[10px] text-slate-400 font-normal no-underline">detail</div>
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-700">
                                        Rp {resident.paidAmount.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        {resident.debtAmount > 0 ? (
                                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded text-[10px] whitespace-nowrap border border-rose-100">
                                                Kurang Rp {resident.debtAmount.toLocaleString()}
                                            </span>
                                        ) : resident.extraAmount > 0 ? (
                                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-[10px] whitespace-nowrap border border-blue-100">
                                                Lebih Rp {resident.extraAmount.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-xs">
                                                <CheckCheck size={14} /> Lunas
                                            </span>
                                        )}
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
            <>
            {logs.filter(l => l.officers && l.officers.length > 0).length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Belum ada data patroli tersimpan.</p>
              </div>
            ) : (
              logs
                .filter(l => l.officers && l.officers.length > 0) 
                .map((log) => (
                <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-slate-500" />
                       <span className="text-sm font-semibold text-slate-700">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">+ Rp {(log.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Petugas: {(log.officers || []).join(', ')}</span>
                    </div>
                    
                    {log.note && (
                        <div className="mb-3 p-2 bg-amber-50 text-amber-800 text-xs rounded border border-amber-100 italic">
                            "{log.note}"
                        </div>
                    )}

                    {log.missedHouses && log.missedHouses.length > 0 ? (
                      <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                        <span className="font-bold block mb-1">Warga Kosong:</span> {log.missedHouses.join(', ')}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> Semua lengkap!</div>
                    )}

                    <button 
                        onClick={() => copyToClipboard(formatWAMessage(log))}
                        className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Share2 size={14} /> Salin Laporan WA
                    </button>
                  </div>
                </div>
              ))
            )}
            </>
        )}
      </div>
    </div>
  );
}

function ResidentCalendarModal({ resident, monthKey, year, month, logs, onClose }) {
    // Generate calendar days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); 
    
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const getStatusForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const log = logs.find(l => l.date === dateStr);
        
        if (!log) return 'no-data';
        
        // Check if this resident paid in advance (Prepaid) - Green/Blue
        if (log.prepaid && log.prepaid[resident.id]) return 'prepaid';

        // Check if Patrol actually happened (Officers exist)
        // If no officers, it means patrol hasn't happened or it's a holiday -> No Data (Gray)
        if (!log.officers || log.officers.length === 0) return 'no-data';

        // Retrieve payment count for the resident
        let count = 0;
        if (log.entries) {
             if (typeof log.entries[resident.id] === 'number') {
                count = log.entries[resident.id];
            } else if (typeof log.entries[resident.id] === 'boolean') {
                count = log.entries[resident.id] ? 1 : 0;
            }
        }

        if (count >= 1) {
             if (count > 1) return 'double'; // Paid extra
             return 'paid'; // Paid normal
        }
        
        // If patrol happened and count is 0 -> Missed (Red)
        return 'missed';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{resident.name}</h3>
                        <p className="text-xs text-slate-300 opacity-80">{monthKey}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                            <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {blanks.map(b => <div key={`blank-${b}`}></div>)}
                        {daysArray.map(day => {
                            const status = getStatusForDay(day);
                            let colorClass = "bg-slate-100 text-slate-400"; // Default / No Data
                            if (status === 'paid') colorClass = "bg-emerald-500 text-white shadow-sm shadow-emerald-200";
                            if (status === 'missed') colorClass = "bg-rose-500 text-white shadow-sm shadow-rose-200";
                            if (status === 'double') colorClass = "bg-blue-500 text-white font-bold ring-2 ring-blue-200";
                            if (status === 'prepaid') colorClass = "bg-sky-400 text-white font-bold shadow-sm shadow-sky-200";

                            return (
                                <div key={day} className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-transform hover:scale-110 ${colorClass}`}>
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> Bayar</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500"></div> Lebih</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-sky-400"></div> Prepaid</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-500"></div> Kosong</div>
                    </div>
                </div>
                
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={onClose} className="text-sm font-bold text-slate-600 hover:text-slate-800">Tutup</button>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ArrowRight,
  Calendar, CheckCircle2, ChevronLeft,
  ChevronDown, UserPlus, Shield, RefreshCw,
  AlertCircle, Loader2, UserCheck, CreditCard
} from 'lucide-react';
import {
  requestOTP,
  verifyOTP,
  saveUserProfile,
  updateNfcUid,
  generatePlaceholderNfcUid,
  lookupUserByNfcUid,
  checkIfAlreadyRegistered,
  playAudio,
  playAudioByAction,
} from '@/utils/api';

type SubStep = 'MODE_SELECT' | 'REGISTRATION' | 'OTP' | 'NFC_TAP' | 'NFC_ISSUE';

interface AlreadyRegisteredInfo {
  name: string;
  hasCard: boolean;
}

export default function LoginPage({ onSuccess, onBack, onNavigate }: any) {
  const { t } = useTranslation();
  const [subStep, setSubStep] = useState<SubStep>('MODE_SELECT');
  const [role] = useState<'citizen' | 'authority'>('citizen');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', sub: '' });
  const [rfidStatus, setRfidStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const [alreadyRegistered, setAlreadyRegistered] = useState<AlreadyRegisteredInfo | null>(null);

  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCheckingCard, setIsCheckingCard] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendError, setSendError] = useState('');
  const [nfcError, setNfcError] = useState('');

  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [issuedNfcUid, setIssuedNfcUid] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '', dob: '', gender: 'Male', phone: '', aadhaar: '', consent: false,
  });

  // Play "Welcome to Access Portal" (Track 1/7/12) when entering this screen
  useEffect(() => {
    playAudioByAction('ACCESS_PORTAL');
  }, []);

  useEffect(() => {
    let interval: any;
    if (subStep === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t: number) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [subStep, timer]);

  // Auto-start RFID scanning when NFC_TAP screen is shown
  useEffect(() => {
    if (subStep === 'NFC_TAP') {
      setRfidStatus('scanning');
      setNfcError('');
      // Play "Tap your card" instruction (Track 6/11/16)
      playAudioByAction('SCAN_CARD');
    } else {
      setRfidStatus('idle');
    }
  }, [subStep]);

  // Handle 1-minute timeout for RFID scan
  useEffect(() => {
    let timeout: any;
    if (subStep === 'NFC_TAP' && rfidStatus === 'scanning') {
      timeout = setTimeout(() => {
        // If still scanning after 60 seconds, trigger failure audio (Track 3/9/14)
        playAudioByAction('AUTH_FAILURE');
        setNfcError(t('login.timeout_error'));
        setRfidStatus('idle'); // Stop scanning
      }, 60000);
    }
    return () => clearTimeout(timeout);
  }, [subStep, rfidStatus]);

  // Poll /check-rfid every 1.5s while scanning
  useEffect(() => {
    if (rfidStatus !== 'scanning') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://172.20.10.4:8000/check-rfid');
        const data = await res.json();

        if (data.status === 'detected') {
          clearInterval(interval);
          setRfidStatus('success');
          setIsCheckingCard(true);

          const result = await lookupUserByNfcUid(data.uid);
          setIsCheckingCard(false);

          if (!result.success || !result.user) {
            setNfcError(t('login.card_not_recognized'));
            setRfidStatus('scanning'); // resume scanning
            return;
          }

          setFormData(prev => ({ ...prev, name: result.user!.name }));
          
          // Play "Access Granted" success audio (Track 2/8/13)
          playAudioByAction('AUTH_SUCCESS');

          triggerSuccess(
            t('login.card_detected'),
            `${t('login.access_granted')} Hello, ${result.user.name}.`,
            'COMPLETE'
          );
        }
      } catch {
        // Backend unreachable — keep polling silently
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [rfidStatus]);

  const triggerSuccess = (title: string, sub: string, nextStep: SubStep | 'COMPLETE') => {
    setSuccessMessage({ title, sub });
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
      if (nextStep === 'COMPLETE') {
        onSuccess(role);
      } else {
        setSubStep(nextStep);
      }
    }, 2200);
  };

  const handleLocateKiosk = () => onNavigate('locate');

  const handleRequestOTP = async () => {
    setSendError('');
    setIsSendingOTP(true);

    const check = await checkIfAlreadyRegistered(formData.phone);

    if (check.registered) {
      setIsSendingOTP(false);
      setAlreadyRegistered({
        name: check.name ?? 'User',
        hasCard: check.hasCard ?? false,
      });
      return;
    }

    const result = await requestOTP(formData.phone);
    setIsSendingOTP(false);

    if (result.success) {
      setOtp(['', '', '', '']);
      setTimer(30);
      setSubStep('OTP');
    } else {
      setSendError(result.error || t('login.failed_send_otp'));
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    const enteredOTP = otp.join('');
    if (enteredOTP.length < 4) {
      setOtpError(t('login.enter_4_digits'));
      return;
    }

    setIsVerifyingOTP(true);
    const otpResult = await verifyOTP(formData.phone, enteredOTP);
    setIsVerifyingOTP(false);

    if (!otpResult.success) {
      setOtpError(otpResult.error || t('login.wrong_otp'));
      return;
    }

    setIsSavingProfile(true);
    const profileResult = await saveUserProfile({
      name: formData.name,
      dob: formData.dob,
      gender: formData.gender,
      phone: formData.phone,
      aadhaar: formData.aadhaar,
    });
    setIsSavingProfile(false);

    // Race condition safety net — someone registered between SEND OTP and now
    if (profileResult.alreadyRegistered) {
      setAlreadyRegistered({
        name: profileResult.existingName ?? formData.name,
        hasCard: false,
      });
      return;
    }

    if (!profileResult.success || !profileResult.userId) {
      setOtpError(profileResult.error || t('login.save_failed'));
      return;
    }

    setSavedUserId(String(profileResult.userId));

    const uid = generatePlaceholderNfcUid();
    setIssuedNfcUid(uid);
    await updateNfcUid(profileResult.userId, uid);

    // Play "Card Issued" success audio (Track 4/10/15)
    playAudioByAction('REG_SUCCESS');

    triggerSuccess(t('login.otp_verified'), t('login.issuing_card'), 'NFC_ISSUE');
  };

  const handleResendOTP = async () => {
    setOtpError('');
    setOtp(['', '', '', '']);
    setTimer(30);
    setIsSendingOTP(true);
    await requestOTP(formData.phone);
    setIsSendingOTP(false);
  };

  const handleNFCTap = async () => {};

  const isFormValid =
    formData.name &&
    formData.dob &&
    formData.phone.length === 10 &&
    formData.aadhaar.length === 12 &&
    formData.consent;

  const handleOtpInput = (val: string, i: number) => {
    if (val.length <= 1 && /^\d*$/.test(val)) {
      const newOtp = [...otp];
      newOtp[i] = val;
      setOtp(newOtp);
      setOtpError('');
      if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const isProcessingOTP = isVerifyingOTP || isSavingProfile;
  const otpButtonLabel = isVerifyingOTP
    ? 'Verifying...'
    : isSavingProfile
    ? 'Saving profile...'
    : 'Continue';

  const sendButtonBusy = isSendingOTP;
  const sendButtonLabel = isSendingOTP ? 'Sending OTP...': 'SEND OTP';

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden font-sans">

      {/* ── Already Registered Popup ─────────────────────────────────────── */}
      <AnimatePresence>
        {alreadyRegistered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-sm bg-[#0a0f1d] border border-amber-500/30 rounded-[2.5rem] p-10 text-center shadow-2xl relative"
            >
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <UserCheck size={36} className="text-amber-400" />
              </div>

              {/* Heading */}
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">
                {t('login.already_registered').split(' ')[0]}{' '}
                <span className="text-amber-400">{t('login.already_registered').split(' ')[1]}</span>
              </h3>

              {/* Name */}
              <p className="text-slate-200 font-black text-lg mt-3">
                {alreadyRegistered.name}
              </p>

              {/* Subtext */}
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2 leading-relaxed">
                {t('login.phone_linked')}
              </p>

              {/* Card status hint */}
              <div className={`mt-5 mx-auto max-w-[260px] px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest leading-relaxed flex items-center justify-center gap-2 ${
                alreadyRegistered.hasCard
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                <CreditCard size={14} />
                {alreadyRegistered.hasCard
                  ? t('login.card_issued_status')
                  : t('login.card_pending_status')}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                {/* Primary: go to existing user login */}
                <button
                  onClick={() => {
                    setAlreadyRegistered(null);
                    setSubStep('NFC_TAP');
                    // rfidStatus will be set to 'scanning' by the subStep useEffect
                  }}
                  className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  <Shield size={14} />
                  {t('login.login_with_card')}
                </button>

                {/* Secondary: go back to mode select */}
                <button
                  onClick={() => {
                    setAlreadyRegistered(null);
                    setSubStep('MODE_SELECT');
                    setFormData({ name: '', dob: '', gender: 'Male', phone: '', aadhaar: '', consent: false });
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                >
                  {t('login.back_to_start')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Popup ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0f1d] border border-emerald-500/30 p-10 rounded-[3rem] text-center shadow-2xl"
            >
              <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-6" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                {successMessage.title.split(' ')[0]}{' '}
                <span className="text-emerald-500">{successMessage.title.split(' ').slice(1).join(' ')}</span>
              </h3>
              <p className="text-slate-400 text-xs font-bold tracking-widest mt-4 uppercase">{successMessage.sub}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="absolute top-10 left-10 z-50 flex items-center gap-2 text-slate-500 hover:text-white uppercase text-[10px] font-bold tracking-widest transition-all italic group">
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('login.back')}
      </button>

      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center px-12 lg:px-24">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl lg:text-7xl font-black italic leading-none tracking-tighter">
              {subStep === 'REGISTRATION' || subStep === 'OTP' 
                ? (localStorage.getItem('i18nextLng') === 'ta' ? 'உருவாக்கு' : localStorage.getItem('i18nextLng') === 'hi' ? 'बनाएं' : 'CREATE')
                : t('login.identity').split(' ')[0]}
              <br />
              <span className="text-emerald-400">{t('login.identity').split(' ')[1]}</span>
            </h1>
            <p className="mt-8 max-w-md text-slate-400 text-lg leading-relaxed">
              {t('login.identity_sub')}
            </p>
            <div className="mt-12 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="text-emerald-500" size={24} />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{t('login.secured')}</p>
            </div>
          </motion.div>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center p-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

          <motion.div layout className="w-[95%] md:w-full max-w-md bg-[#0a0f1d] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden z-10 mx-auto">
            <AnimatePresence mode="wait">

              {/* MODE SELECT */}
              {subStep === 'MODE_SELECT' && (
                <motion.div key="mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 text-center">
                  <h2 className="text-4xl font-black uppercase text-white italic tracking-tighter leading-none">{t('login.title').split(' ')[0]} <span className="text-emerald-500">{t('login.title').split(' ')[1]}</span></h2>
                  <div className="space-y-4">
                    <button onClick={() => { setSubStep('REGISTRATION'); }} className="w-full p-6 bg-[#111827] border border-white/5 rounded-3xl flex items-center gap-6 hover:bg-emerald-500 group transition-all text-left">
                      <UserPlus size={24} className="text-emerald-500 group-hover:text-black" />
                      <div className="text-white group-hover:text-black uppercase italic font-black">{t('login.new_user')}</div>
                      <ArrowRight size={18} className="ml-auto text-slate-700 group-hover:text-black" />
                    </button>
                    <button onClick={() => { setSubStep('NFC_TAP'); }} className="w-full p-6 bg-[#111827] border border-white/5 rounded-3xl flex items-center gap-6 hover:bg-emerald-500 group transition-all text-left">
                      <Shield size={24} className="text-emerald-500 group-hover:text-black" />
                      <div className="text-white group-hover:text-black uppercase italic font-black">{t('login.existing_user')}</div>
                      <ArrowRight size={18} className="ml-auto text-slate-700 group-hover:text-black" />
                    </button>
                    <button onClick={handleLocateKiosk} className="w-full p-6 bg-[#111827] border border-white/5 rounded-3xl flex items-center gap-6 hover:bg-[#0b1220] transition-all text-left group">
                      <ShieldCheck size={24} className="text-emerald-500" />
                      <div className="flex flex-col">
                        <span className="text-white uppercase italic font-black">{t('login.locate_kiosk')}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('login.locate_sub')}</span>
                      </div>
                      <ArrowRight size={18} className="ml-auto text-slate-700 group-hover:text-emerald-400" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* NFC TAP */}
              {subStep === 'NFC_TAP' && (
                <motion.div key="nfc_tap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 py-6">

                  {/* Animated scanner circle */}
                  <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
                    {/* Outer pulse rings */}
                    {rfidStatus === 'scanning' && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                          className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
                          className="absolute inset-4 rounded-full border border-emerald-400/30"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.8 }}
                          className="absolute inset-8 rounded-full border border-emerald-300/20"
                        />
                      </>
                    )}
                    {/* Icon */}
                    <motion.div
                      animate={rfidStatus === 'scanning' ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        rfidStatus === 'success'
                          ? 'bg-emerald-500/20 border-emerald-500'
                          : isCheckingCard
                          ? 'bg-emerald-500/10 border-emerald-400/50'
                          : 'bg-emerald-500/5 border-emerald-500/20'
                      }`}
                    >
                      {isCheckingCard ? (
                        <Loader2 size={48} className="text-emerald-400 animate-spin" />
                      ) : (
                        <ShieldCheck
                          size={48}
                          className={`transition-all duration-300 ${
                            rfidStatus === 'success' ? 'text-emerald-400' : 'text-emerald-500/60'
                          }`}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Text */}
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                      {t('login.tap_card').split(' ')[0]} <span className="text-emerald-500">{t('login.tap_card').split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed px-6">
                      {isCheckingCard
                        ? t('login.verifying_card')
                        : rfidStatus === 'scanning'
                        ? t('login.hold_card')
                        : t('login.card_detected')}
                    </p>
                  </div>

                  {/* Live status badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isCheckingCard
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : rfidStatus === 'scanning'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  }`}>
                    <motion.div
                      animate={{ opacity: rfidStatus === 'scanning' && !isCheckingCard ? [1, 0.2, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className={`w-2 h-2 rounded-full ${
                        isCheckingCard ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                    {isCheckingCard ? t('login.verifying_card') : rfidStatus === 'scanning' ? t('login.scanner_active') : t('login.card_detected')}
                  </div>

                  {/* Error */}
                  {nfcError && (
                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-[11px] font-bold">{nfcError}</p>
                    </div>
                  )}

                  {/* Back to menu */}
                  <button
                    onClick={() => setSubStep('MODE_SELECT')}
                    className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                  >
                    ← {t('login.back')}
                  </button>
                </motion.div>
              )}

              {/* REGISTRATION */}
              {subStep === 'REGISTRATION' && (
                <motion.div key="reg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-black uppercase text-white italic tracking-tighter leading-none">{t('login.create_profile').split(' ')[0]} <span className="text-emerald-400">{t('login.create_profile').split(' ')[1]}</span></h2>
                  </div>
                  <div className="space-y-3">
                    <input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('login.name_placeholder')}
                      className="w-full p-4 bg-[#111827] border border-white/5 rounded-2xl outline-none focus:border-emerald-500/50 text-white text-sm font-bold placeholder:text-slate-500"
                    />
                    <div className="grid grid-cols-[1.4fr,1fr] gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={t('login.dob_placeholder')}
                          value={formData.dob}
                          onChange={e => {
                            let val = e.target.value.replace(/[^\d]/g, '');
                            if (val.length > 8) val = val.slice(0, 8);
                            if (val.length > 4) val = val.slice(0, 2) + '-' + val.slice(2, 4) + '-' + val.slice(4);
                            else if (val.length > 2) val = val.slice(0, 2) + '-' + val.slice(2);
                            setFormData({ ...formData, dob: val });
                          }}
                          maxLength={10}
                          className="w-full p-4 bg-[#111827] border border-white/5 rounded-2xl text-white text-sm font-bold outline-none focus:border-emerald-500/50"
                        />
                        <Calendar className="absolute right-4 top-4 text-slate-600 pointer-events-none" size={16} />
                      </div>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full p-4 bg-[#111827] border border-white/5 rounded-2xl text-white text-sm font-bold outline-none appearance-none focus:border-emerald-500/50 cursor-pointer"
                        >
                          <option value="Male">{t('login.male')}</option>
                          <option value="Female">{t('login.female')}</option>
                          <option value="Rather not to say">{t('login.rather_not_say')}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-4 text-slate-600 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => { setFormData({ ...formData, phone: e.target.value }); setSendError(''); }}
                      placeholder={t('login.phone_placeholder')}
                      className="w-full p-4 bg-[#111827] border border-white/5 rounded-2xl text-white text-sm font-bold outline-none focus:border-emerald-500/50 placeholder:text-slate-500"
                    />
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.aadhaar}
                      onChange={e => setFormData({ ...formData, aadhaar: e.target.value })}
                      placeholder={t('login.aadhaar_placeholder')}
                      className="w-full p-4 bg-[#111827] border border-white/5 rounded-2xl text-white text-sm font-bold outline-none focus:border-emerald-500/50 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-start gap-3 px-1 pt-2">
                    <div
                      onClick={() => setFormData({ ...formData, consent: !formData.consent })}
                      className={`mt-0.5 min-w-[18px] h-[18px] rounded border transition-all cursor-pointer flex items-center justify-center ${formData.consent ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}
                    >
                      {formData.consent && <CheckCircle2 size={12} className="text-black" />}
                    </div>
                    <p
                      className="text-[11px] text-slate-400 font-bold leading-snug cursor-pointer select-none"
                      onClick={() => setFormData({ ...formData, consent: !formData.consent })}
                    >
                      {t('login.consent')}
                    </p>
                  </div>

                  {sendError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-[11px] font-bold">{sendError}</p>
                    </div>
                  )}

                  <button
                    disabled={!isFormValid || sendButtonBusy}
                    onClick={handleRequestOTP}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] font-black transition-all ${
                      isFormValid && !sendButtonBusy
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {sendButtonBusy
                      ? <><Loader2 size={16} className="animate-spin" /> {t('login.sending_otp')}</>
                      : <>{t('login.send_otp')} <ArrowRight size={16} /></>}
                  </button>
                </motion.div>
              )}

              {/* OTP */}
              {subStep === 'OTP' && (
                <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-4">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{t('login.verify_otp').split(' ')[0]} <span className="text-emerald-400">{t('login.verify_otp').split(' ')[1]}</span></h2>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                      {t('login.otp_sent')} <span className="text-emerald-400">+91 {formData.phone}</span>
                      <br /><span className="text-slate-600 normal-case text-[10px]">{t('login.check_sms')}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 py-2">
                    {otp.map((d: string, i: number) => (
                      <input
                        key={i} id={`otp-${i}`} type="text" maxLength={1} value={d}
                        onChange={(e) => handleOtpInput(e.target.value, i)}
                        className={`w-16 h-20 bg-[#111827] border text-white focus:bg-[#1a2236] text-center text-3xl font-black rounded-2xl outline-none transition-all ${
                          otpError ? 'border-red-500/50' : 'border-white/5 focus:border-emerald-500/50'
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-[11px] font-bold">{otpError}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <button
                      onClick={handleVerifyOTP}
                      disabled={isProcessingOTP || otp.join('').length < 4}
                      className={`w-full py-5 font-black rounded-[2rem] uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                        otp.join('').length === 4 && !isProcessingOTP
                          ? 'bg-emerald-500 text-black hover:scale-[1.02]'
                          : 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingOTP
                        ? <><Loader2 size={16} className="animate-spin" /> {t('login.sending_otp')}</>
                        : t('login.verify_otp')}
                    </button>

                    <div className="flex flex-col items-center gap-2">
                      <div className="h-[1px] w-12 bg-white/10 mb-2" />
                      {timer > 0 ? (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {t('login.resend_in')} <span className="text-emerald-400 ml-1">{timer}s</span>
                        </p>
                      ) : (
                        <button onClick={handleResendOTP} disabled={isSendingOTP} className="group flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase tracking-widest hover:text-white transition-colors">
                          <RefreshCw size={12} className={isSendingOTP ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                          {isSendingOTP ? t('login.sending_otp') : t('login.resend_now')}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* NFC ISSUE */}
              {subStep === 'NFC_ISSUE' && (
                <motion.div key="nfc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-10">
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 2.5 }}
                    className="relative w-64 h-40 mx-auto bg-gradient-to-br from-[#4ade80] to-[#166534] rounded-2xl p-6 shadow-[0_20px_50px_rgba(74,222,128,0.2)] overflow-hidden border border-white/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]" />
                    <div className="h-full flex flex-col justify-between text-left">
                      <ShieldCheck className="text-white/60" size={32} />
                      <div>
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-1">Legal Identity Card</p>
                        <p className="text-lg font-black text-white uppercase tracking-tighter leading-none">{formData.name || (localStorage.getItem('i18nextLng') === 'ta' ? 'குடிமகன்' : localStorage.getItem('i18nextLng') === 'hi' ? 'नागरिक' : 'CITIZEN')}</p>
                        {issuedNfcUid && (
                          <p className="text-[9px] text-white/40 font-montserrat mt-1">UID: {issuedNfcUid}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{t('login.card_issued').split(' ')[0]} <span className="text-emerald-400">{t('login.card_issued').split(' ')[1]}</span></h2>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mx-auto max-w-[280px] text-[11px] text-emerald-400 font-black uppercase tracking-widest leading-relaxed">
                      {t('login.collect_card')}
                    </div>
                    {savedUserId && (
                      <p className="text-[9px] text-slate-600 font-montserrat">Profile saved · ID: {String(savedUserId).slice(0, 8)}…</p>
                    )}
                  </div>
                  <button
                    onClick={() => onSuccess(role)}
                    className="w-full py-5 bg-white text-black font-black rounded-[2rem] uppercase text-[12px] tracking-[0.2em] hover:scale-[1.02] transition-transform"
                  >
                    {t('login.enter_portal')}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { left: -150%; } 100% { left: 150%; } }
      `}</style>
    </div>
  );
}

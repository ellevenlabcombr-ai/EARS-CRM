"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';

const MainDashboard = dynamic(() => import('@/components/MainDashboard').then(mod => mod.MainDashboard), {
  ssr: false
});

const AthleteDashboard = dynamic(() => import('@/components/AthleteDashboard').then(mod => mod.AthleteDashboard), {
  ssr: false
});

const LoginScreen = dynamic(() => import('@/components/LoginScreen').then(mod => mod.LoginScreen), {
  ssr: false
});

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AppLayout } from '@/components/layout/AppLayout';

import { LogoLoader } from '@/components/LogoLoader';

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center h-full bg-[#050B14]">
    <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
  </div>
);

type Role = 'admin' | 'athlete' | null;

export default function Home() {
  const [userRole, setUserRole] = useState<Role>(null);
  const [loggedInAthlete, setLoggedInAthlete] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<'logout' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('ears_session');
    
    const minimumSplashTime = new Promise(resolve => setTimeout(resolve, 2000));

    const initializeSession = async () => {
      let activeRole = null;
      let activeAthlete = null;

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (new Date().getTime() - session.timestamp < thirtyDays) {
            activeRole = session.role;
            if (session.athleteData) {
              activeAthlete = session.athleteData;
            }
          } else {
            localStorage.removeItem('ears_session');
          }
        } catch (e) {
          console.error("Error parsing saved session:", e);
          localStorage.removeItem('ears_session');
        }
      }

      await minimumSplashTime;

      setUserRole(activeRole);
      if (activeAthlete) {
        setLoggedInAthlete(activeAthlete);
      }
      setIsInitializing(false);
      setShowSplash(false);
    };
    
    initializeSession();
  }, []);

  const handleLogout = () => {
    if (isDirty) {
      setPendingAction('logout');
    } else {
      localStorage.removeItem('ears_session');
      setUserRole(null);
      setLoggedInAthlete(null);
    }
  };

  const handleLogin = (role: Role, athleteData?: any) => {
    setUserRole(role);
    if (athleteData) {
      setLoggedInAthlete(athleteData);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait" onExitComplete={() => setSplashFinished(true)}>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050B14]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center"
            >
              <LogoLoader size="2xl" />
              <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "200px" }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
                  className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-8"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isInitializing && splashFinished && (
        <AnimatePresence mode="wait">
          {!userRole ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#050B14] flex flex-col items-center justify-center"
            >
              <div className="w-full flex-1 flex flex-col items-center justify-center px-4 max-h-[100dvh]">
                <LoginScreen onLogin={handleLogin} />
              </div>
            </motion.div>
          ) : userRole === 'athlete' ? (
            <motion.div
              key="athlete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#050B14]"
            >
              <AppLayout withSafeTop={false} withSafeBottom={false}>
                <AthleteDashboard 
                  onBack={handleLogout} 
                  onDirtyChange={setIsDirty}
                  athleteId={loggedInAthlete?.id}
                  athleteGender={loggedInAthlete?.gender}
                  initialAthleteData={loggedInAthlete}
                />
                <ConfirmDialog 
                  isOpen={pendingAction === 'logout'}
                  onConfirm={() => {
                    setPendingAction(null);
                    setIsDirty(false);
                    localStorage.removeItem('ears_session');
                    setUserRole(null);
                    setLoggedInAthlete(null);
                  }}
                  onCancel={() => setPendingAction(null)}
                />
              </AppLayout>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#050B14]"
            >
              <AppLayout withSafeTop={false} withSafeBottom={false}>
                <MainDashboard onLogout={handleLogout} />
              </AppLayout>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

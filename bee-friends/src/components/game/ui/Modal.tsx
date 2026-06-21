'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalContent } from '@/constants/animations';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1a1530, #130f28)',
              border: '1.5px solid rgba(245,158,11,0.35)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {title && (
              <h2 className="text-xl font-bold mb-4" style={{ color: '#f59e0b' }}>{title}</h2>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#9b91c8' }}
            >
              ✕
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

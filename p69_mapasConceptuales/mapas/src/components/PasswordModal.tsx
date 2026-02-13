import React, { useState } from 'react';
import { useConceptStore } from '../store/useConceptStore';

export const PasswordModal: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isOpen = useConceptStore((s) => s.isPasswordModalOpen);
  const setIsOpen = useConceptStore((s) => s.setIsPasswordModalOpen);
  const verifyPassword = useConceptStore((s) => s.verifyPassword);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await verifyPassword(password);
    
    if (!result.success) {
      setError(result.error || 'Contraseña incorrecta');
      setIsLoading(false);
    } else {
      setPassword('');
      setIsLoading(false);
    }
  };

  return (
    <div translate="no" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md scale-100 transform rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl transition-all">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Modo Edición</h2>
          <p className="mt-2 text-sm text-slate-400">Ingresa la contraseña para habilitar los cambios</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              autoFocus
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none ring-blue-500/50 transition-all focus:border-blue-500 focus:ring-4"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useUsers } from '@/contexts/DataUser';

const ForcePasswordChangePage = () => {
  const navigate = useNavigate();
  const { currentUser, changePassword, logout } = useUsers();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);
    const result = await changePassword({ currentPassword, newPassword });
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Não foi possível alterar a senha.');
      return;
    }

    if (currentUser?.role === 'Admin' || currentUser?.role === 'Seller') {
      navigate('/admin', { replace: true });
      return;
    }

    if (currentUser?.role === 'Lojista') {
      navigate('/anunciar', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Alterar Senha Obrigatória — Reconectare</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-md shadow-sm">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Atualização de Segurança</h1>
          <p className="text-sm text-gray-600 mb-8">
            No primeiro acesso, você precisa alterar sua senha para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Senha Atual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Digite sua senha atual"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Digite a nova senha"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 rounded-md font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-70"
            >
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForcePasswordChangePage;

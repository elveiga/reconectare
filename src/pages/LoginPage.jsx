import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Mail, Lock, Info } from 'lucide-react';
import { useUsers } from '@/contexts/DataUser';

const LoginPage = () => {
  const { login } = useUsers();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const res = await login({ email, senha });
    if (res.success) {
      if (res.requiresPasswordChange) {
        navigate('/alterar-senha', { replace: true });
        return;
      }

      const role = res.user.role;
      if (role === 'Admin') navigate('/admin');
      else if (role === 'Seller') navigate('/admin');
      else if (role === 'Lojista') navigate('/anunciar');
      else navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login — Reconectare</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-md shadow-sm">
          <h1 className="text-2xl font-bold mb-8 text-gray-800">Entrar</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo E-mail */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  type="password"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {/* Caixa de informação de atendimento */}
            <div className="bg-blue-50 rounded-md p-3 flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-600">
                <p className="font-medium mb-1">Não possui acesso?</p>
                <p>
                  Para realizar o cadastro, entre em contato com nosso time de atendimento em{' '}
                  <span className="font-medium">contato@reconectare.com.br</span>.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-gray-800 text-white py-3 rounded-md font-medium text-sm hover:bg-gray-900 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

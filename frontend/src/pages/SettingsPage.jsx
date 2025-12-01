import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Paramètres</h1>
        <p className="text-sm text-slate-600">
          Cette section sera bientôt disponible. Vous pourrez y ajuster vos
          préférences (unités, langue, etc.).
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 text-sm text-slate-600">
        Pour l&apos;instant, vous pouvez déjà configurer vos véhicules dans
        l&apos;onglet <strong>Mes véhicules</strong>.  
        Les autres paramètres d&apos;application seront ajoutés dans une
        prochaine étape.
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;



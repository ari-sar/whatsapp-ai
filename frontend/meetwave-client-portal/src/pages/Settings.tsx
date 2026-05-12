import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { listPlans } from '../api/plansService';
import { Plan } from '../types/plan';

export const Settings: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    if (!user?.planId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const plans = await listPlans();
        setPlan(plans.find((p) => p.id === user.planId) ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.planId]);

  const handleLogout = () => {
    presentAlert({
      header: 'Log out',
      message: 'You will need your mobile number to log back in.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log out',
          role: 'destructive',
          handler: () => {
            logout();
            history.replace('/login');
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Name</p>
              <h3>{user?.name ?? '—'}</h3>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Business</p>
              <h3>{user?.businessName ?? '—'}</h3>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Mobile</p>
              <h3>{user?.phone ?? '—'}</h3>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Plan</p>
              <h3>{loading ? <IonSpinner name="dots" /> : plan?.name ?? '—'}</h3>
            </IonLabel>
            {plan && <IonNote slot="end">{plan.billingCycle}</IonNote>}
          </IonItem>
          <IonItem button detail onClick={() => presentAlert({ header: 'Coming soon', message: 'Plan management will be available shortly.', buttons: ['OK'] })}>
            <IonLabel color="primary">Change plan</IonLabel>
          </IonItem>
        </IonList>

        <div style={{ padding: 16 }}>
          <IonButton expand="block" color="danger" fill="outline" onClick={handleLogout}>
            Log out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

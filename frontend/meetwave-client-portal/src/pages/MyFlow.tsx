import { useEffect, useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import { listFlows, getMyFlow, setMyFlow } from '../api/flowsService';
import { BusinessFlow } from '../types/flow';

export const MyFlow: React.FC = () => {
  const [flows, setFlows] = useState<BusinessFlow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const load = async () => {
    try {
      setLoading(true);
      const [list, mine] = await Promise.all([listFlows(), getMyFlow()]);
      setFlows(list);
      setCurrentId(mine);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmChange = (flow: BusinessFlow) => {
    if (flow.id === currentId) return;
    presentAlert({
      header: 'Switch flow?',
      message: `Switch to "${flow.name}"? Your existing leads will continue in their current flow, but new conversations will use the new one.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Switch',
          handler: async () => {
            try {
              setSaving(flow.id);
              await setMyFlow(flow.id);
              setCurrentId(flow.id);
              presentToast({ message: 'Flow updated', duration: 1500, color: 'success' });
            } catch (err: any) {
              presentToast({ message: err.message ?? 'Failed to switch flow', duration: 2000, color: 'danger' });
            } finally {
              setSaving(null);
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/home" />
          </IonButtons>
          <IonTitle>My Flow</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText color="medium">
          <p>Choose the conversational flow your customers go through on WhatsApp. Flows are designed and maintained by Meetwave.</p>
        </IonText>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          flows.map((flow) => {
            const isCurrent = flow.id === currentId;
            return (
              <IonCard
                key={flow.id}
                button
                onClick={() => confirmChange(flow)}
                style={isCurrent ? { borderLeft: '4px solid var(--ion-color-primary)' } : undefined}
              >
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ color: 'var(--ion-text-color)' }}>{flow.name}</strong>
                        {isCurrent && (
                          <IonChip color="primary" outline>
                            <IonIcon icon={checkmarkCircle} />
                            Active
                          </IonChip>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ion-color-medium)', marginBottom: 4 }}>{flow.businessType}</div>
                      <div style={{ fontSize: 13 }}>{flow.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 6 }}>{flow.stepCount} steps</div>
                    </div>
                    {saving === flow.id && <IonSpinner name="dots" />}
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })
        )}
      </IonContent>
    </IonPage>
  );
};

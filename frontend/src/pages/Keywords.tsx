import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { createKeyword, deleteKeyword, getKeywords, type Keyword } from '@/services/keywordService';
import { getResponses, type ResponseRecord } from '@/services/responseService';

const Keywords: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [responseId, setResponseId] = useState('');
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const modal = useRef<HTMLIonModalElement>(null);
  const [presentAlert] = useIonAlert();

  const load = async () => {
    try {
      const [kw, res] = await Promise.all([getKeywords(), getResponses()]);
      setKeywords(kw);
      setResponses(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!trigger.trim() || !responseId || !clientId.trim()) return;
    setSaving(true);
    try {
      await createKeyword({ trigger: trigger.trim(), response_id: responseId, client_id: clientId.trim() });
      setTrigger('');
      setResponseId('');
      setClientId('');
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    presentAlert({
      header: 'Delete Keyword Rule',
      message: 'Remove this trigger rule?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await deleteKeyword(id);
            await load();
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Trigger Rules</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <IonItem key={i}>
              <IonLabel><IonSkeletonText animated style={{ width: '70%' }} /></IonLabel>
            </IonItem>
          ))
        ) : (
          <IonList>
            {keywords.map((kw) => (
              <IonCard key={kw.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <IonBadge color="primary">{kw.trigger}</IonBadge>
                        <span style={{ fontSize: 13, color: 'var(--ion-color-medium)' }}>→</span>
                        <span style={{ fontSize: 14 }}>{kw.response?.message ?? kw.response_id}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ion-color-medium)' }}>
                        Client: {kw.client_id}
                      </p>
                    </div>
                    <IonButton fill="clear" color="danger" onClick={() => handleDelete(kw.id)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
            {keywords.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 40 }}>
                No rules yet. Add a trigger below.
              </p>
            )}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setModalOpen(true)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonModal ref={modal} isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>New Trigger Rule</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Client ID *</IonLabel>
            <IonInput
              value={clientId}
              onIonInput={(e) => setClientId(e.detail.value ?? '')}
              placeholder="e.g. client_abc123"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Trigger Keyword *</IonLabel>
            <IonInput
              value={trigger}
              onIonInput={(e) => setTrigger(e.detail.value ?? '')}
              placeholder="e.g. price, hello, info"
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Response *</IonLabel>
            <IonSelect
              value={responseId}
              onIonChange={(e) => setResponseId(e.detail.value)}
              placeholder="Select a response"
            >
              {responses.map((r) => (
                <IonSelectOption key={r.id} value={r.id}>
                  {r.message.length > 60 ? r.message.slice(0, 60) + '…' : r.message}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonButton
            expand="block"
            style={{ marginTop: 16 }}
            onClick={handleCreate}
            disabled={saving || !trigger.trim() || !responseId || !clientId.trim()}
          >
            {saving ? 'Saving...' : 'Create Rule'}
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Keywords;

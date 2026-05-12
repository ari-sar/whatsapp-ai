import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonTextarea,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, trash, create as createIcon } from 'ionicons/icons';
import { Plan, PlanInput, createPlan, deletePlan, listPlans, updatePlan } from '../api/plansService';

const emptyInput: PlanInput = {
  name: '',
  priceInPaise: 0,
  currency: 'INR',
  billingCycle: 'monthly',
  durationDays: 30,
  description: '',
  discountAmount: null,
  discountDays: null,
  features: [],
  isActive: true,
};

export const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PlanInput>(emptyInput);
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const load = async () => {
    setLoading(true);
    try {
      setPlans(await listPlans());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyInput);
    setFeaturesText('');
    setOpen(true);
  };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setDraft({
      name: p.name,
      priceInPaise: p.priceInPaise,
      currency: p.currency,
      billingCycle: p.billingCycle,
      durationDays: p.durationDays,
      description: p.description,
      discountAmount: p.discountAmount,
      discountDays: p.discountDays,
      features: p.features,
      isActive: p.isActive,
    });
    setFeaturesText((p.features ?? []).join('\n'));
    setOpen(true);
  };

  const handleSave = async () => {
    const features = featuresText.split('\n').map((s) => s.trim()).filter(Boolean);
    const payload: PlanInput = { ...draft, features };
    setSaving(true);
    try {
      if (editing) {
        await updatePlan(editing.id, payload);
        presentToast({ message: 'Plan updated', duration: 1500, color: 'success' });
      } else {
        await createPlan(payload);
        presentToast({ message: 'Plan created', duration: 1500, color: 'success' });
      }
      setOpen(false);
      load();
    } catch (err: any) {
      presentToast({ message: err.response?.data?.error ?? 'Save failed', duration: 2000, color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (p: Plan) => {
    presentAlert({
      header: 'Delete plan?',
      message: `Delete "${p.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await deletePlan(p.id);
              presentToast({ message: 'Deleted', duration: 1500, color: 'success' });
              load();
            } catch (err: any) {
              presentToast({ message: err.response?.data?.error ?? 'Delete failed', duration: 2000, color: 'danger' });
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
          <IonTitle>Plans</IonTitle>
          <IonButton slot="end" onClick={openNew}>
            <IonIcon slot="start" icon={add} />
            New
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          <IonList>
            {plans.map((p) => (
              <IonItem key={p.id}>
                <IonLabel>
                  <h2>{p.name} {!p.isActive && <IonNote> (inactive)</IonNote>}</h2>
                  <p>
                    ₹{(p.priceInPaise / 100).toFixed(2)} {p.currency} · {p.billingCycle}
                    {p.durationDays != null && <> · {p.durationDays} days</>}
                  </p>
                  {(p.discountAmount != null || p.discountDays != null) && (
                    <IonNote color="success">
                      Discount: ₹{((p.discountAmount ?? 0) / 100).toFixed(2)} for {p.discountDays ?? 0} days
                    </IonNote>
                  )}
                  {p.description && <p style={{ fontSize: 12 }}>{p.description}</p>}
                </IonLabel>
                <IonButton slot="end" fill="clear" onClick={() => openEdit(p)}>
                  <IonIcon icon={createIcon} />
                </IonButton>
                <IonButton slot="end" fill="clear" color="danger" onClick={() => confirmDelete(p)}>
                  <IonIcon icon={trash} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editing ? 'Edit Plan' : 'New Plan'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setOpen(false)}>
                Cancel
              </IonButton>
              <IonButton slot="end" onClick={handleSave} disabled={saving}>
                {saving ? <IonSpinner name="dots" /> : 'Save'}
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Name *</IonLabel>
              <IonInput value={draft.name} onIonInput={(e) => setDraft({ ...draft, name: e.detail.value ?? '' })} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Price (in paise) *</IonLabel>
              <IonInput
                type="number"
                value={draft.priceInPaise}
                onIonInput={(e) => setDraft({ ...draft, priceInPaise: Number(e.detail.value ?? 0) })}
              />
              <IonNote slot="helper">Whole rupees × 100. E.g. ₹499 = 49900.</IonNote>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Currency</IonLabel>
              <IonInput
                value={draft.currency ?? 'INR'}
                onIonInput={(e) => setDraft({ ...draft, currency: e.detail.value ?? 'INR' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Billing cycle</IonLabel>
              <IonInput
                value={draft.billingCycle ?? 'monthly'}
                onIonInput={(e) => setDraft({ ...draft, billingCycle: e.detail.value ?? 'monthly' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Duration (days)</IonLabel>
              <IonInput
                type="number"
                value={draft.durationDays ?? ''}
                onIonInput={(e) => {
                  const v = e.detail.value;
                  setDraft({ ...draft, durationDays: v == null || v === '' ? null : Number(v) });
                }}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={draft.description ?? ''}
                onIonInput={(e) => setDraft({ ...draft, description: e.detail.value ?? '' })}
              />
            </IonItem>

            <h3 style={{ padding: '16px 16px 0' }}>Limited-time discount (optional)</h3>
            <IonItem>
              <IonLabel position="stacked">Discount amount (in paise)</IonLabel>
              <IonInput
                type="number"
                value={draft.discountAmount ?? ''}
                onIonInput={(e) => {
                  const v = e.detail.value;
                  setDraft({ ...draft, discountAmount: v == null || v === '' ? null : Number(v) });
                }}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Valid for (days)</IonLabel>
              <IonInput
                type="number"
                value={draft.discountDays ?? ''}
                onIonInput={(e) => {
                  const v = e.detail.value;
                  setDraft({ ...draft, discountDays: v == null || v === '' ? null : Number(v) });
                }}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Features (one per line)</IonLabel>
              <IonTextarea
                autoGrow
                value={featuresText}
                onIonInput={(e) => setFeaturesText(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Active</IonLabel>
              <IonToggle
                checked={draft.isActive ?? true}
                onIonChange={(e) => setDraft({ ...draft, isActive: e.detail.checked })}
              />
            </IonItem>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

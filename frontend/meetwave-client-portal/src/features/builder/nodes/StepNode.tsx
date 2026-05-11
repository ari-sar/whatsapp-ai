import { Handle, Position, NodeProps } from '@xyflow/react';
import { IonIcon } from '@ionic/react';
import {
  playCircleOutline,
  textOutline,
  listOutline,
  checkmarkCircleOutline,
  stopCircleOutline,
} from 'ionicons/icons';
import { useBuilderStore } from '../../../store/useBuilderStore';
import './nodes.css';

const iconMap: Record<string, any> = {
  start: playCircleOutline,
  text: textOutline,
  list: listOutline,
  button: checkmarkCircleOutline,
  condition: checkmarkCircleOutline,
  end: stopCircleOutline,
};

export const StepNode: React.FC<NodeProps> = ({ id, data }) => {
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);
  const isSelected = selectedNodeId === id;
  const icon = iconMap[data.type] || textOutline;

  return (
    <div
      className={`step-node ${isSelected ? 'selected' : ''}`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="step-node-content">
        <IonIcon icon={icon} className="step-node-icon" />
        <div className="step-node-label">{data.label || id}</div>
        {data.prompt && <div className="step-node-prompt">{data.prompt.substring(0, 30)}...</div>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

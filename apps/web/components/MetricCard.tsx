interface MetricCardProps {
  label: string;
  value: number;
  color: 'orange' | 'saffron' | 'amber' | 'red';
}

export default function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses = {
    orange: 'bg-orange-50 border-orange-200',
    saffron: 'bg-amber-50 border-amber-200',
    amber: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
  };

  const textColorClasses = {
    orange: 'text-orange-600',
    saffron: 'text-amber-600',
    amber: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6`}>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <p className={`${textColorClasses[color]} text-4xl font-bold`}>{value}</p>
    </div>
  );
}

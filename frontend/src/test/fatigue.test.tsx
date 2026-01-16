import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricGauge from '../components/fatigue/MetricGauge';

describe('Fatigue Monitoring Tests', () => {
    it('should be running in a jsdom environment', () => {
        expect(window).toBeDefined();
        document.body.innerHTML = '<div>Hello</div>';
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders MetricGauge correctly', () => {
        render(
            <MetricGauge
                value={1.6}
                min={0}
                max={2.0}
                zones={[
                    { min: 0, max: 0.8, color: "bg-green-500", label: "Low" },
                    { min: 0.8, max: 1.3, color: "bg-blue-500", label: "Optimal" },
                    { min: 1.3, max: 1.5, color: "bg-yellow-500", label: "Warning" },
                    { min: 1.5, max: 2.0, color: "bg-red-500", label: "High" },
                ]}
                label="ACWR"
                unit=""
            />
        );
        expect(screen.getByText('ACWR')).toBeInTheDocument();
        // 1.6 should be High Zone
    });
});

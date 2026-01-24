import { Fragment, type FC } from "react";
import styles from "./Stepper.module.css";

export interface StepperStep {
  id: string;
  label?: string;
  completed?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  activeStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: FC<StepperProps> = ({
  steps,
  activeStepIndex,
  onStepClick,
  className = "",
}) => {
  const getStepStatus = (index: number) => {
    if (index < activeStepIndex) {
      return "completed";
    }
    if (index === activeStepIndex) {
      return "active";
    }
    return "pending";
  };

  const handleStepClick = (index: number) => {
    if (onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <div className={`${styles.stepper} ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <Fragment key={step.id}>
            <div
              className={`${styles.stepContainer} ${
                onStepClick ? styles.clickable : ""
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div className={`${styles.step} ${styles[status]}`}>
                {status === "completed" ? (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.checkmarkIcon}
                  >
                    <circle cx="8" cy="8" r="8" fill="#ecf15e" />
                    <path
                      d="M11 6L7 10L5 8"
                      stroke="#000000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className={styles.stepNumber}>{index + 1}</span>
                )}
              </div>
              {step.label && (
                <span className={`${styles.stepLabel} ${styles[status]}`}>
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={`${styles.connector} ${
                  status === "completed" || status === "active"
                    ? styles.completed
                    : styles.pending
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

Stepper.displayName = "Stepper";

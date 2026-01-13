"use client";
/*
 * Documentation:
 * Button — https://app.subframe.com/7b6524b882e5/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../utils";

interface ButtonRootProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  variant?:
    | "brand-primary"
    | "brand-secondary"
    | "brand-tertiary"
    | "neutral-primary"
    | "neutral-secondary"
    | "neutral-tertiary"
    | "destructive-primary"
    | "destructive-secondary"
    | "destructive-tertiary"
    | "inverse";
  size?: "large" | "medium" | "small";
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  function ButtonRoot(
    {
      disabled = false,
      variant = "brand-primary",
      size = "medium",
      children,
      icon = null,
      iconRight = null,
      loading = false,
      className,
      type = "button",
      ...otherProps
    }: ButtonRootProps,
    ref
  ) {
    // Map Subframe variants to existing button classes
    const getButtonClass = () => {
      const sizeClass = size === "small" ? "-sm" : "";
      
      switch (variant) {
        case "brand-primary":
          return `btn-primary${sizeClass}`;
        case "brand-secondary":
          return `btn-secondary${sizeClass}`;
        case "brand-tertiary":
          return `btn-ghost${sizeClass}`;
        case "destructive-primary":
          return `btn-danger${sizeClass}`;
        case "destructive-secondary":
          return `btn-danger-outline${sizeClass}`;
        case "destructive-tertiary":
          return `btn-ghost${sizeClass}`;
        case "neutral-primary":
          return `btn-ghost${sizeClass}`;
        case "neutral-secondary":
          return `btn-secondary${sizeClass}`;
        case "neutral-tertiary":
          return `btn-ghost${sizeClass}`;
        case "inverse":
          return `btn-ghost${sizeClass}`;
        default:
          return `btn-primary${sizeClass}`;
      }
    };

    const buttonClass = getButtonClass();
    const hasIcon = icon || iconRight;
    const iconClass = hasIcon ? (size === "small" ? "btn-with-icon-sm" : "btn-with-icon") : "";

    return (
      <button
        className={SubframeUtils.twClassNames(
          buttonClass,
          iconClass,
          "group/3b777358",
          className
        )}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        {...otherProps}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <SubframeCore.Loader
              className={SubframeUtils.twClassNames(
                "h-4 w-4",
                {
                  "h-3 w-3": size === "small",
                  "h-5 w-5": size === "large",
                }
              )}
            />
          </div>
        ) : icon ? (
          <span className={SubframeUtils.twClassNames(
            "flex items-center",
            {
              "w-4 h-4": size === "small",
              "w-5 h-5": size === "medium",
              "w-6 h-6": size === "large",
            }
          )}>
            {icon}
          </span>
        ) : null}
        {children && !loading ? (
          <span className="whitespace-nowrap">
            {children}
          </span>
        ) : null}
        {iconRight && !loading ? (
          <span className={SubframeUtils.twClassNames(
            "flex items-center",
            {
              "w-4 h-4": size === "small",
              "w-5 h-5": size === "medium",
              "w-6 h-6": size === "large",
            }
          )}>
            {iconRight}
          </span>
        ) : null}
      </button>
    );
  }
);

export const Button = ButtonRoot;

"use client";
import { useField } from "formik";
import { LockKeyhole, LockKeyholeOpen, PenTool } from "lucide-react";
import { useState } from "react";
import { Input, InputProps } from "../input";
import { Label } from "../label";
import { Badge } from "../badge";
import { InputAreaProps, Textarea } from "../textarea";
import { cn } from "@/src/lib/utils";

export const TextInput = ({
  className,
  type = "text",
  labelIcon,
  labelClass,
  showBadge = true,
  ...props
}: InputProps & { label: string; labelClass?: string }) => {
  const [show, setShow] = useState(false);
  const [field, meta] = useField({
    name: props.name || "",
    onChange: props.onChange,
    id: props.id,
  });

  return (
    <div>
      <div className="relative grid space-y-4">
        <Label
          htmlFor={props?.id || props?.label}
          className={cn(
            "text-base font-semibold flex items-center space-x-2",
            labelClass
          )}
        >
          {labelIcon ?? labelIcon}
          <span>{props.label}</span>
          {showBadge && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              Required
            </Badge>
          )}
        </Label>
        {type === "password" ? (
          <div className="relative">
            <Input
              id={props.name}
              {...props}
              {...field}
              type={show ? "text" : "password"}
            />

            <span
              onClick={() => setShow(!show)}
              className="absolute cursor-pointer transition-all right-4 top-[32%]"
            >
              {show ? <LockKeyholeOpen size={17} /> : <LockKeyhole size={17} />}
            </span>
          </div>
        ) : (
          <Input
            id={props.name}
            {...props}
            {...field}
            type={type}
            className={className}
          />
        )}
      </div>
      {meta.touched && meta.error ? (
        <div className="p-2 px-0 pb-0 text-xs text-red-500">{meta.error}</div>
      ) : null}
    </div>
  );
};

export const TextAreaInput = ({
  className,
  labelIcon,
  ...props
}: InputAreaProps & { label: string }) => {
  const [field, meta] = useField({
    name: props.name || "",
    onChange: props.onChange,
    id: props.id,
  });

  return (
    <div>
      <div className="relative grid space-y-4">
        <Label
          htmlFor={props?.id || props?.label}
          className="text-base font-semibold flex items-center space-x-2"
        >
          {labelIcon ?? labelIcon}
          <span>{props.label}</span>
          <Badge variant="outline" className="text-xs px-2 py-0">
            Required
          </Badge>
        </Label>
        <Textarea id={props.name} {...props} {...field} className={className} />
      </div>
      {meta.touched && meta.error ? (
        <div className="p-2 px-0 pb-0 text-xs text-red-500">{meta.error}</div>
      ) : null}
    </div>
  );
};

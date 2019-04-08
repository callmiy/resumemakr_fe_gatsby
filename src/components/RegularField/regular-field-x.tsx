import React, { useContext } from "react";
import { FieldProps } from "formik";
import { Input, Form } from "semantic-ui-react";

import { FormContext } from "../ResumeForm/resume-form";

interface Props<Values> extends FieldProps<Values> {
  label: string | JSX.Element;
  // tslint:disable-next-line:no-any
  comp?: React.ComponentClass<any>;
}

export function RegularField<Values>(props: Props<Values>) {
  const { field, label, comp: Component = Input } = props;

  const { value, name } = field;

  const formContext = useContext(FormContext);

  return (
    <Form.Field>
      {"string" === typeof label ? (
        <label htmlFor={name}>{label}</label>
      ) : (
        label
      )}

      <Component
        {...field}
        value={value || ""}
        id={field.name}
        onBlur={formContext.valueChanged}
      />
    </Form.Field>
  );
}

export default RegularField;

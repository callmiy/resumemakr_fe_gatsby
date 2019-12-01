import {
  FormFieldState,
  FormFieldEditChanging,
  FormFieldInvalid,
} from "../components.types";
import { ResumeTitlesFrag_edges_node } from "../../graphql/apollo-types/ResumeTitlesFrag";
import { UpdateResumeMinimalProps } from "../../graphql/apollo/update-resume.mutation";
import { Reducer } from "react";
import { wrapReducer } from "../../logger";
import immer from "immer";
import { ApolloError } from "apollo-client";
import * as Yup from "yup";
import { ValidationError } from "yup";
import { UpdateResumeMinimalVariables } from "../../graphql/apollo-types/UpdateResumeMinimal";
import { UpdateResumeErrorsFragment_errors } from "../../graphql/apollo-types/UpdateResumeErrorsFragment";

export enum Mode {
  create = "@mode/create",
  update = "@mode/update",
  clone = "@mode/clone",
}

export function initState(props: Props): StateMachine {
  const resume = (props.resume || {
    title: "",
    description: "",
  }) as ResumeTitlesFrag_edges_node;

  return {
    value: "editable",
    editable: {
      form: {
        context: {
          title: resume.title,
          description: resume.description as string,
        },

        fields: {
          title: {
            edit: {
              value: "unchanged",
            },
            validity: {
              value: "unvalidated",
            },
          },
          description: {
            edit: {
              value: "unchanged",
            },
            validity: {
              value: "unvalidated",
            },
          },
        },

        validity: {
          value: "unvalidated",
        },

        mode: {
          value: Mode.update,
          update: {
            context: {
              resume,
            },
          },
        },
      },
    },
  };
}

export enum ActionType {
  CLOSE = "@create-update-clone-resume/close",
  SUBMIT = "@create-update-clone-resume/submit",
  SUBMITTING = "@create-update-clone-resume/submitting",
  SUBMIT_SUCCESS = "@create-update-clone-resume/submit-success",
  SERVER_ERRORS = "@create-update-clone-resume/server-error",
  FORM_CHANGED = "@create-update-clone-resume/form-changed",
  FORM_FIELD_BLURRED = "@create-update-clone-resume/form-blurred",
}

const validationSchema = Yup.object<ValidationSchemaShape>().shape({
  title: Yup.string()
    .required()
    .min(2)
    .when("$mode", (mode: ModeState, schema: Yup.StringSchema) => {
      if (mode.value === Mode.update) {
        return schema.test(
          "title-unchanged",
          "${path} has not been modified",
          function(formTitle) {
            const resume = mode.update.context.resume;

            // title has not been changed - then description must be changed
            if (formTitle === resume.title) {
              return this.parent.description !== resume.description;
            }

            return true;
          },
        );
      }

      return schema;
    }),
  description: Yup.string().when(
    "$mode",
    (mode: ModeState, schema: Yup.StringSchema) => {
      if (mode.value === Mode.update) {
        return schema.test(
          "description-unchanged",
          "${path} has not been modified",
          function(formDescription: string) {
            const resume = mode.update.context.resume;

            // if description not changed, then title must be changed
            if (formDescription === resume.description) {
              return this.parent.title !== resume.title;
            }

            return true;
          },
        );
      }

      return schema;
    },
  ),
});

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        switch (type) {
          case ActionType.CLOSE:
            {
              proxy.value = "closed";
            }

            break;

          case ActionType.FORM_CHANGED:
            {
              const { fieldName, value } = payload as FormFieldChangedPayload;
              const form = (proxy as Editable).editable.form;
              const formFields = (proxy as Editable).editable.form.fields;

              const formField = (formFields[
                fieldName as KeyOfFormState
              ] as FormFieldState).edit;

              form.context[fieldName] = value;
              formField.value = "changing";
            }

            break;

          case ActionType.FORM_FIELD_BLURRED:
            {
              const { fieldName } = payload as FormFieldBlurredPayload;
              const formState = (proxy as Editable).editable.form;
              const fieldStates = formState.fields;

              const fieldState = fieldStates[
                fieldName as KeyOfFormState
              ] as FormFieldState;

              const editingState = fieldState.edit as FormFieldEditChanging;

              if (editingState.value === "changing") {
                const fieldValidity = fieldState.validity;

                try {
                  validationSchema.validateSyncAt(
                    fieldName,
                    formState.context,
                    {
                      context: {
                        mode: {
                          value: "",
                        },
                      },
                    },
                  );

                  fieldState.edit.value = "changed";
                  fieldValidity.value = "valid";
                } catch (error) {
                  setFieldValidity(fieldValidity, error.message);
                  formState.validity.value = "invalid";
                }
              }
            }

            break;

          case ActionType.SUBMITTING:
            {
              const { formState, formIsValid } = payload as SubmittingPayload;

              if (formIsValid) {
                proxy.value = "submitting";
              } else {
                proxy.value = "editable";
              }

              (proxy as Editable).editable.form = formState;
            }

            break;

          case ActionType.SUBMIT_SUCCESS:
            {
              const formMode = (proxy as Editable).editable.form
                .mode as UpdateMode;

              formMode.value = Mode.update;
              formMode.update = {
                context: {
                  resume: (payload as SubmitSuccessPayload).resume,
                },
              };

              proxy.value = "submitSuccess";
            }

            break;

          case ActionType.SERVER_ERRORS:
            {
              proxy.value = "serverErrors";
              const stateMachine = proxy as ServerErrors;
              stateMachine.serverErrors = {
                value: "fieldErrors",
              };

              const errors = (payload as ServerErrorsPayload).errors;
              const fieldErrors = errors as UpdateResumeErrorsFragment_errors;

              if (fieldErrors.__typename) {
                const formState = (proxy as Editable).editable.form;
                formState.validity.value = "invalid";
                const formFields = formState.fields;

                const { title, description, error } = fieldErrors;

                if (title) {
                  setFieldValidity(formFields.title.validity, title);
                }

                if (description) {
                  setFieldValidity(
                    formFields.description.validity,
                    description,
                  );
                }

                if (error) {
                  stateMachine.serverErrors = {
                    value: "nonFieldError",
                    nonFieldError: {
                      context: {
                        error,
                      },
                    },
                  };
                }

                return;
              }

              if ("string" === typeof errors) {
                stateMachine.serverErrors = {
                  value: "nonFieldError",
                  nonFieldError: {
                    context: {
                      error: errors,
                    },
                  },
                };

                return;
              }

              stateMachine.serverErrors = {
                value: "nonFieldError",
                nonFieldError: {
                  context: {
                    error: (errors as Error).message,
                  },
                },
              };
            }

            break;
        }
      });
    },
    // true,
  );

function setFieldValidity(
  fieldValidity: FormFieldState["validity"],
  error: string,
) {
  fieldValidity.value = "invalid";
  const invalidState = fieldValidity as FormFieldInvalid;
  invalidState.invalid = {
    context: {
      error,
    },
  };
}

export function validateForm(formState: EditableFormState) {
  let formIsValid = false;

  const newFormState = immer(formState, proxy => {
    const formFields = proxy.fields;

    try {
      validationSchema.validateSync(proxy.context, {
        abortEarly: false,
        context: {
          mode: proxy.mode,
        },
      });
      proxy.validity.value = "valid";
      formFields.title.validity.value = "valid";
      formFields.description.validity.value = "valid";

      formIsValid = true;
    } catch (error) {
      const errors = error as ValidationError;
      proxy.validity.value = "invalid";

      errors.inner.forEach(fieldError => {
        const fieldInvalid = formFields[fieldError.path] as FormFieldState;
        fieldInvalid.validity = {
          value: "invalid",
          invalid: {
            context: {
              error: fieldError.message,
            },
          },
        };
      });
    }
  });

  return {
    newFormState,
    formIsValid,
  };
}

export function computeFormSubmissionData(formState: EditableFormState) {
  const result = {} as UpdateResumeMinimalVariables["input"];
  const { context } = formState;

  if (formState.mode.value === Mode.update) {
    const resume = formState.mode.update.context.resume;
    result.id = resume.id;

    if (resume.title !== context.title) {
      result.title = context.title;
    }

    if (resume.description !== context.description) {
      result.description = context.description;
    }
  }

  return result;
}

export const uiTexts = {
  cloneFromTitle: "Clone from:",
  updateResume: "Update: ",
  updateSuccessMessage: "Resume updated successfully",

  form: {
    title: "Title e.g. name of company to send to",
    description: "Description",
    submitBtnText: "Yes",
    closeModalBtnText: "Close",
  },
};

export type StateMachine =
  | {
      value: "submitting";
    }
  | {
      value: "submitSuccess";
    }
  | {
      value: "closed";
    }
  | Editable
  | ServerErrors;

export interface Editable {
  value: "editable";
  editable: {
    form: EditableFormState;
  };
}

interface EditableFormState {
  context: {
    title: string;
    description: string;
  };
  fields: FormState;
  validity: {
    value: "valid" | "invalid" | "unvalidated";
  };
  mode: ModeState;
}

interface ModeContext {
  context: {
    resume: ResumeTitlesFrag_edges_node;
  };
}

type ModeState =
  | UpdateMode
  | {
      value: Mode.create;
    }
  | CloneMode;

interface UpdateMode {
  value: Mode.update;
  update: ModeContext;
}

interface CloneMode {
  value: Mode.clone;
  clone: ModeContext;
}

interface FormState {
  title: FormFieldState;
  description: FormFieldState;
}

interface ServerErrors {
  value: "serverErrors";
  serverErrors:
    | {
        value: "fieldErrors";
      }
    | ServerNonFieldError;
}

interface ServerNonFieldError {
  value: "nonFieldError";
  nonFieldError: {
    context: {
      error: string;
    };
  };
}

export interface OwnProps {
  mode: Mode;
  resume?: ResumeTitlesFrag_edges_node;
  onClose: () => void;
}

type KeyOfFormState = keyof FormState;

interface FormFieldChangedPayload {
  value: string;
  fieldName: KeyOfFormState;
}

interface FormFieldBlurredPayload {
  fieldName: KeyOfFormState;
}

interface ServerErrorsPayload {
  errors: ApolloError | UpdateResumeErrorsFragment_errors | string;
}

interface SubmittingPayload {
  formState: EditableFormState;
  formIsValid: boolean;
}

interface SubmitSuccessPayload {
  resume: ResumeTitlesFrag_edges_node;
}

type Action =
  | ({
      type: ActionType.FORM_CHANGED;
    } & FormFieldChangedPayload)
  | {
      type: ActionType.SUBMIT;
    }
  | ({
      type: ActionType.FORM_FIELD_BLURRED;
    } & FormFieldBlurredPayload)
  | (SubmittingPayload & {
      type: ActionType.SUBMITTING;
    })
  | (SubmitSuccessPayload & {
      type: ActionType.SUBMIT_SUCCESS;
    })
  | {
      type: ActionType.CLOSE;
    }
  | ({
      type: ActionType.SERVER_ERRORS;
    } & ServerErrorsPayload);

export type Props = OwnProps & UpdateResumeMinimalProps;

type ValidationSchemaShape = Editable["editable"]["form"]["context"];

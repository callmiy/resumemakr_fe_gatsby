import React, { useContext } from "react";
import { TextArea, Icon } from "semantic-ui-react";
import { FieldArrayRenderProps, Field } from "formik";

import { CircularLabel } from "../../styles/mixins";
import RegularField from "../RegularField";
import { FormContext } from "../ResumeForm/resume-form";

interface Props {
  values: string[];
  fieldName: string;
  arrayHelper: FieldArrayRenderProps;
  hiddenLabel?: string;
  header?: JSX.Element;
  controlComponent?: React.ComponentClass | React.FunctionComponent;
  appendToHiddenLabel?: string;
}

export function ListStrings(props: Props) {
  const {
    values,
    fieldName: parentFieldName,
    arrayHelper,
    hiddenLabel,
    header,
    controlComponent,
    appendToHiddenLabel
  } = props;

  const valuesLen = values.length;

  const { valueChanged } = useContext(FormContext);

  return (
    <div>
      {header || null}

      {values.map((value, index) => {
        const fieldName = makeListStringFiledName(parentFieldName, index);
        const index1 = index + 1;

        return (
          <Field
            key={index}
            name={fieldName}
            label={
              <div className="with-controls list-string-header">
                {`# ${index1}`}

                <div>
                  {valuesLen > 1 && (
                    <CircularLabel
                      color="blue"
                      onClick={function onSwapAchievementsUp() {
                        arrayHelper.swap(index, index1);
                        valueChanged();
                      }}
                    >
                      <Icon name="arrow down" />
                    </CircularLabel>
                  )}

                  {valuesLen > 1 && (
                    <CircularLabel
                      color="red"
                      onClick={function onRemoveAchievement() {
                        arrayHelper.remove(index);
                        valueChanged();
                      }}
                    >
                      <Icon name="remove" />
                    </CircularLabel>
                  )}

                  <CircularLabel
                    color="green"
                    onClick={function onAddAchievement() {
                      arrayHelper.insert(index1, "");
                      valueChanged();
                    }}
                  >
                    <Icon name="add" />
                  </CircularLabel>

                  {index1 > 1 && (
                    <CircularLabel
                      color="blue"
                      onClick={function onSwapAchievementsUp() {
                        arrayHelper.swap(index, index - 1);
                        valueChanged();
                      }}
                    >
                      <Icon name="arrow up" />
                    </CircularLabel>
                  )}
                </div>

                {appendToHiddenLabel && (
                  <label className="visually-hidden" htmlFor={fieldName}>
                    {fieldName + appendToHiddenLabel}
                  </label>
                )}

                {hiddenLabel && (
                  <label className="visually-hidden" htmlFor={fieldName}>
                    {hiddenLabel}
                  </label>
                )}
              </div>
            }
            defaultValue={value}
            comp={controlComponent || TextArea}
            component={RegularField}
          />
        );
      })}
    </div>
  );
}

export default ListStrings;

export function makeListStringFiledName(
  parentFieldName: string,
  index: number
) {
  return `${parentFieldName}[${index}]`;
}

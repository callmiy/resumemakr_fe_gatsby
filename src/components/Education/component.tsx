import React, { useContext } from "react";
import { Icon, Card } from "semantic-ui-react";
import { FastField, FieldArray } from "formik";

import { EducationInput } from "../../graphql/apollo/types/globalTypes";

import { FormContext } from "../UpdateResumeForm/utils";
import { SectionLabel } from "../SectionLabel";
import { RegularField } from "../RegularField";
import {
  emptyVal,
  makeEduFieldName,
  eduFieldName,
  Props,
  uiTexts
} from "./utils";
import { ListIndexHeader } from "../ListIndexHeader";
import { ListStrings } from "../ListStrings";
import { SubFieldLabel } from "../components";

const headerLabelText = "School";

export function Education(props: Props) {
  const { label } = props;
  const values = (props.values || [{ ...emptyVal }]) as EducationInput[];

  return (
    <>
      <SectionLabel
        label={label}
        ico={<Icon name="won" />}
        data-testid="education-section"
      />

      <FieldArray
        name={eduFieldName}
        render={arrayHelper =>
          values.map((edu, index) => (
            <School key={index} edu={edu} index={index} values={values} />
          ))
        }
      />
    </>
  );
}

function School({
  edu,
  index,
  values
}: {
  edu: EducationInput;
  index: number;
  values: EducationInput[];
}) {
  const { setFieldValue } = useContext(FormContext);
  let achievements = edu.achievements || [""];

  if (achievements.length === 0) {
    achievements = [""];
  }

  return (
    <Card>
      <ListIndexHeader
        index={index}
        label={headerLabelText}
        fieldName={eduFieldName}
        setFieldValue={setFieldValue}
        values={values}
        empty={emptyVal}
      />

      <Card.Content>
        <FastField
          name={makeEduFieldName(index, "school")}
          label={
            <SubFieldLabel
              text={uiTexts.schoolLabel}
              fieldName={makeEduFieldName(index, "school")}
            />
          }
          defaultValue={edu.school}
          component={RegularField}
        />

        <FastField
          name={makeEduFieldName(index, "course")}
          defaultValue={edu.course}
          component={RegularField}
          label={
            <SubFieldLabel
              text={uiTexts.courseLabel}
              fieldName={makeEduFieldName(index, "course")}
            />
          }
        />

        <FastField
          name={makeEduFieldName(index, "fromDate")}
          defaultValue={edu.fromDate}
          component={RegularField}
          label={
            <SubFieldLabel
              text={uiTexts.fromDateLabel}
              fieldName={makeEduFieldName(index, "fromDate")}
            />
          }
        />

        <FastField
          name={makeEduFieldName(index, "toDate")}
          defaultValue={edu.toDate}
          component={RegularField}
          label={
            <SubFieldLabel
              text={uiTexts.toDateLabel}
              fieldName={makeEduFieldName(index, "toDate")}
            />
          }
        />

        <FieldArray
          name={makeEduFieldName(index, "achievements")}
          render={helper => {
            return (
              <ListStrings
                values={achievements as string[]}
                arrayHelper={helper}
                header={
                  <div>
                    {uiTexts.achievementsHeader0}
                    <span> {uiTexts.achievementsHeader1}</span>
                  </div>
                }
                fieldName={makeEduFieldName(index, "achievements")}
                appendToHiddenLabel={uiTexts.achievementsHiddenLabel}
              />
            );
          }}
        />
      </Card.Content>
    </Card>
  );
}
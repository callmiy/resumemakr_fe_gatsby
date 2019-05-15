import React, { useContext, useState, useRef, useEffect, memo } from "react";
import { Icon, Modal, Button } from "semantic-ui-react";

import "./styles.scss";
import { AppModal } from "../AppModal";
import { toServerUrl } from "../utils";
import { FormContext } from "../UpdateResumeForm/utils";
import { Props, PhotoFieldState, uiTexts } from "./utils";

export const PhotoField = memo(PhotoFieldComp, PhotoFieldDiff);

function PhotoFieldComp(props: Props) {
  const {
    field: { value = null, name: fieldName },
    form
  } = props;
  const formContext = useContext(FormContext);
  const [fileState, setFileState] = useState(PhotoFieldState.clean);
  const [url, setUrl] = useState<string | null>("");
  const [openModal, setOpenModal] = useState(false);

  const currentValueRef = useRef<string | null>(value);

  useEffect(() => {
    if (value) {
      setUrl(`url(${toServerUrl(value)})`);
      setFileState(PhotoFieldState.previewing);
    }

    /**
     * We only update state if user selected a different photo than the one
     * currently in state
     */
    if (currentValueRef.current !== value) {
      currentValueRef.current = value;
      formContext.valueChanged();
    }
  }, [value]);

  function touch() {
    setFileState(PhotoFieldState.touched);
  }

  function unTouch() {
    setFileState(PhotoFieldState.previewing);
  }

  function onDelete() {
    setFileState(PhotoFieldState.deleted);
    setUrl(null);
    setOpenModal(false);
    form.setFieldValue(fieldName, null);
  }

  function handleFileUpload(evt: React.SyntheticEvent<HTMLInputElement>) {
    const file = (evt.currentTarget.files || [])[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Encoded = reader.result as string;
      form.setFieldValue(fieldName, base64Encoded);
      setUrl(`url(${base64Encoded})`);
      setFileState(PhotoFieldState.previewing);
    };

    reader.readAsDataURL(file);
  }

  function renderFileInput(label: string) {
    return (
      <>
        <label className="change-photo" htmlFor={fieldName}>
          <Icon name="upload" /> {label}
        </label>

        <input
          type="file"
          accept="image/*"
          className="input-file"
          name={fieldName}
          id={fieldName}
          onChange={handleFileUpload}
        />
      </>
    );
  }

  function renderThumb() {
    if (!url) {
      return null;
    }

    return (
      <div
        className="components-photo-field thumb"
        data-testid="photo-preview"
        onClick={touch}
        onMouseLeave={unTouch}
        onMouseEnter={touch}
        style={{
          backgroundImage: url
        }}
      >
        {fileState === PhotoFieldState.touched && (
          <div className="editor-container" data-testid="edit-btns">
            {renderFileInput(uiTexts.changePhotoText)}

            <label
              className="change-photo"
              onClick={evt => {
                evt.stopPropagation();
                setOpenModal(true);
              }}
            >
              <Icon name="delete" /> {uiTexts.deletePhotoText}
            </label>
          </div>
        )}
      </div>
    );
  }

  function renderModal() {
    return (
      <AppModal open={openModal}>
        <Modal.Header>{uiTexts.dialogHeader}</Modal.Header>

        <Modal.Content>
          <Modal.Description>
            <div>{uiTexts.deletePhotoConfirmationText}</div>
          </Modal.Description>
        </Modal.Content>

        <Modal.Actions>
          <Button
            positive={true}
            icon="remove"
            labelPosition="right"
            content={uiTexts.negativeToRemovePhotoText}
            onClick={() => {
              setOpenModal(false);
            }}
          />

          <Button
            negative={true}
            icon="checkmark"
            labelPosition="right"
            content={uiTexts.positiveToRemovePhotoText}
            onClick={onDelete}
          />
        </Modal.Actions>
      </AppModal>
    );
  }

  return (
    <>
      {(fileState === PhotoFieldState.previewing ||
        fileState === PhotoFieldState.touched) &&
        renderThumb()}

      {(fileState === PhotoFieldState.clean ||
        fileState === PhotoFieldState.deleted) && (
        <div className="components-photo-field file-chooser">
          <div className="upload-photo-icon-wrapper">
            <Icon name="camera" />
          </div>

          {renderFileInput(uiTexts.uploadPhotoText)}
        </div>
      )}

      {renderModal()}
    </>
  );
}

/**
 * We set both values to null because the values can either be null or
 * undefined so we always get null if we receive undefined
 */
function PhotoFieldDiff(
  { field: { value: value1 = null } }: Props,
  { field: { value: value2 = null } }: Props
) {
  return value1 === value2;
}
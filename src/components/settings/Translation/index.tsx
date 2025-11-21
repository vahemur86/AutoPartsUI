import { useState } from "react";
import {
  Tab,
  TabGroup,
  Button,
  TextField,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@/ui-kit";
import { languages } from "@/constants/settings";
import { Pencil } from "lucide-react";
import styles from "./Translation.module.css";

const Translation = () => {
  const [activeTab, setActiveTab] = useState("add-new");
  const [entityName, setEntityName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [entityId, setEntityId] = useState("");
  const [languageCode, setLanguageCode] = useState("");

  const handleCancel = () => {
    setEntityName("");
    setFieldName("");
    setFieldValue("");
    setEntityId("");
    setLanguageCode("");
  };

  const handleAdd = () => {
    // TODO: Handle add translation
    console.log("Add translation:", {
      entityName,
      fieldName,
      fieldValue,
      entityId,
      languageCode,
    });
    handleCancel();
  };

  return (
    <div className={styles.translationWrapper}>
      <div className={styles.translation}>
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <TabGroup variant="segmented">
            <Tab
              variant="segmented"
              active={activeTab === "add-new"}
              text="Add New Translation"
              onClick={() => setActiveTab("add-new")}
            />
            <Tab
              variant="segmented"
              active={activeTab === "translation-history"}
              text="Translation History"
              onClick={() => setActiveTab("translation-history")}
            />
          </TabGroup>
        </div>

        {/* Content */}
        {activeTab === "add-new" && (
          <div className={styles.formContainer}>
            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <TextField
                  label="Entity name"
                  placeholder="Type"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                />
              </div>
              <div className={styles.formColumn}>
                <TextField
                  label="Entity ID"
                  placeholder="Type"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <TextField
                  label="Field name"
                  placeholder="Type"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                />
              </div>
              <div className={styles.formColumn}>
                <TextField
                  label="Field value"
                  placeholder="Type"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <Select
                  label="Language code"
                  placeholder="Select"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </Select>
              </div>
              <div className={styles.formColumn}></div>
            </div>
          </div>
        )}

        {activeTab === "translation-history" && (
          <div className={styles.historyContainer}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell asHeader>Entity name</TableCell>
                  <TableCell asHeader>Entity ID</TableCell>
                  <TableCell asHeader>Field name</TableCell>
                  <TableCell asHeader>Language code</TableCell>
                  <TableCell asHeader>Value</TableCell>
                  <TableCell asHeader></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>12345</TableCell>
                  <TableCell>name</TableCell>
                  <TableCell>en</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>
                    <IconButton
                      variant="secondary"
                      size="small"
                      icon={<Pencil size={14} color="#ffffff" />}
                      ariaLabel="Edit"
                      onClick={() => {}}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>67890</TableCell>
                  <TableCell>description</TableCell>
                  <TableCell>ru</TableCell>
                  <TableCell>Описание категории</TableCell>
                  <TableCell>
                    <IconButton
                      variant="secondary"
                      size="small"
                      icon={<Pencil size={14} color="#ffffff" />}
                      ariaLabel="Edit"
                      onClick={() => {}}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>11111</TableCell>
                  <TableCell>title</TableCell>
                  <TableCell>am</TableCell>
                  <TableCell>Անվանում</TableCell>
                  <TableCell>
                    <IconButton
                      variant="secondary"
                      size="small"
                      icon={<Pencil size={14} color="#ffffff" />}
                      ariaLabel="Edit"
                      onClick={() => {}}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {activeTab === "add-new" && (
        <div className={styles.actionButtons}>
          <Button variant="secondary" size="medium" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="medium" onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default Translation;

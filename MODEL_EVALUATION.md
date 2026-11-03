# StudentRiskAI – Model Evaluation

## 1. Dataset

The model was trained and evaluated using the UCI Student Performance dataset (Portuguese language course).

- Total records: 649
- Input features: G1, G2, studytime, failures
- Target: Academic risk category derived from final grade (G3)
- Risk categories:
  - High Risk: G3 < 10
  - Medium Risk: 10 ≤ G3 < 12
  - Low Risk: G3 ≥ 12

## 2. Model

- Algorithm: Support Vector Machine (SVM)
- Best parameters: C = 10, kernel = linear, gamma = scale, class_weight = balanced
- Evaluation: 80/20 stratified train-test split
- Cross-validation: 5-fold stratified cross-validation

## 3. Results

| Metric | Result |
|---|---:|
| Cross-validation macro F1 | 85.79% |
| Test accuracy | 79.23% |
| Test macro precision | 74% |
| Test macro recall | 78% |
| Test macro F1-score | 76% |

## 4. Confusion Matrix

Rows represent actual categories; columns represent predicted categories.

| Actual / Predicted | High Risk | Medium Risk | Low Risk |
|---|---:|---:|---:|
| High Risk | 16 | 4 | 0 |
| Medium Risk | 10 | 28 | 2 |
| Low Risk | 0 | 11 | 59 |

## 5. Limitations

- The model uses only four academic features.
- Risk categories are defined using the dataset's final grades.
- The results are based on one train-test split.
- Predictions should support, not replace, teacher judgment.

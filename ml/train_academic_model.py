
import os
import joblib
import pandas as pd
import shap

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# 1. Load dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

data = pd.read_csv(
    os.path.join(BASE_DIR, "dataset", "student-por.csv"),
    sep=";"
)


# 2. Create risk categories using final grade (G3)
def assign_risk(grade):
    if grade < 10:
        return "High Risk"
    elif grade < 12:
        return "Medium Risk"
    else:
        return "Low Risk"


data["risk_level"] = data["G3"].apply(assign_risk)


# 3. Select only the academic features
feature_columns = [
    "G1",
    "G2",
    "studytime",
    "failures"
]

X = data[feature_columns]
y = data["risk_level"]


# 4. Split training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# 5. Prepare numerical features
preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            Pipeline(steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]),
            feature_columns
        )
    ]
)


# 6. Preprocess the data
X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)


# 7. Tune the SVM model
parameter_grid = {
    "C": [0.1, 1, 10, 100],
    "kernel": ["linear", "rbf"],
    "gamma": ["scale", "auto"],
    "class_weight": ["balanced"]
}

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

grid_search = GridSearchCV(
    estimator=SVC(),
    param_grid=parameter_grid,
    scoring="f1_macro",
    cv=cv,
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train_processed, y_train)

best_svm = grid_search.best_estimator_


# 8. Evaluate the model
predictions = best_svm.predict(X_test_processed)

print("\nBEST PARAMETERS:")
print(grid_search.best_params_)

print("\nCROSS-VALIDATION MACRO F1:")
print(grid_search.best_score_)

print("\nTEST ACCURACY:")
print(accuracy_score(y_test, predictions))

print("\nCLASSIFICATION REPORT:")
print(classification_report(
    y_test,
    predictions,
    zero_division=0
))

print("\nCONFUSION MATRIX:")
labels = ["High Risk", "Medium Risk", "Low Risk"]

cm = confusion_matrix(
    y_test,
    predictions,
    labels=labels
)

print("Labels:", labels)
print(cm)


# 9. Prepare SHAP background data
background = shap.sample(
    X_train_processed,
    30,
    random_state=42
)


# 10. Save the model and required information
artifact_folder = os.path.join(
    BASE_DIR,
    "model_artifacts"
)

os.makedirs(artifact_folder, exist_ok=True)

model_artifacts = {
    "preprocessor": preprocessor,
    "model": best_svm,
    "background": background,
    "feature_columns": feature_columns,
    "class_names": best_svm.classes_.tolist()
}

model_path = os.path.join(
    artifact_folder,
    "student_risk_model_academic.joblib"
)

joblib.dump(model_artifacts, model_path)

print("\nACADEMIC MODEL SAVED SUCCESSFULLY!")
print("Saved location:", model_path)

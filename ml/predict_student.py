
import os
import joblib
import shap
import numpy as np
import pandas as pd

from functools import lru_cache


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model_artifacts",
    "student_risk_model_academic.joblib"
)


@lru_cache(maxsize=1)
def load_model():

    artifacts = joblib.load(MODEL_PATH)

    preprocessor = artifacts["preprocessor"]
    model = artifacts["model"]
    background = artifacts["background"]
    feature_columns = artifacts["feature_columns"]

    explainer = shap.KernelExplainer(
        model.decision_function,
        background
    )

    return preprocessor, model, explainer, feature_columns


def predict_student(student_data):

    preprocessor, model, explainer, feature_columns = load_model()

    student_df = pd.DataFrame(
        [student_data],
        columns=feature_columns
    )

    student_processed = preprocessor.transform(student_df)

    predicted_risk = model.predict(student_processed)[0]

    class_index = list(model.classes_).index(predicted_risk)

    shap_values = explainer.shap_values(
        student_processed,
        nsamples=100
    )

    shap_values = np.asarray(shap_values)

    if shap_values.ndim == 3:
        student_shap_values = shap_values[0, :, class_index]
    else:
        student_shap_values = shap_values[0]

    feature_names = preprocessor.get_feature_names_out()

    contributions = sorted(
        zip(feature_names, student_shap_values),
        key=lambda item: item[1],
        reverse=True
    )

    reasons = []

    for feature, value in contributions:

        if value > 0 and len(reasons) < 3:

            reasons.append({
                "factor": feature.replace("num__", "").replace("_", " ").title(),
                "influence": round(float(value), 3)
            })

    return {
        "risk_level": str(predicted_risk),
        "reasons": reasons
    }


if __name__ == "__main__":

    sample_student = {
        "G1": 10,
        "G2": 9,
        "studytime": 2,
        "failures": 1
    }

    result = predict_student(sample_student)

    print("\nSTUDENT RISK PREDICTION")
    print(result)

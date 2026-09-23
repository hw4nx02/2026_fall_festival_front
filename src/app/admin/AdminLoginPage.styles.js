import styled from 'styled-components'

// AdminThemeProvider 안쪽이라 GlobalStyle(라이트 테마)의 body 배경을 덮어써야 해서
// Page에서 adminTheme 배경을 직접 칠한다.
export const Page = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background: #E0E0E0;
`;

export const Form = styled.form`
    width: 100%;
    max-width: 375px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
`;

// 추후 이미지로 변경
export const Logo = styled.div`
    width: 150px;
    height: 150px;
    aspect-ratio: 1/1;
    background: #989898;
    font-size: 16px;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    
`;

export const Title = styled.h1`
    color: #000;
    font-family: var(--font-pretendard);
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
`;

export const InputWrapper = styled.div`
    position: relative;
    width: 343px;
`;

export const KeyIcon = styled.img`
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
`;

export const Input = styled.input`
    display: flex;
    width: 100%;
    padding-left: 48px;
    height: 43px;
    padding-bottom: 3px;
    justify-content: center;
    align-items: center;
    font-size: 10px;
    border-radius: 99px;
    border: 0.5px solid #000;
    background-color: #E0E0E0;
`;

// 로그인 실패 이유 — 다른 관리자 화면의 ErrorMessage(LanternManage)와 같은 톤
export const ErrorMessage = styled.p`
    width: 343px;
    margin: 0;
    color: #AD0000;
    font-size: 11px;
    text-align: center;
    font-family: var(--font-pretendard);
`;

export const SubmitButton = styled.button`
    display: flex;
    width: 343px;
    height: 60px;
    padding: 20px 0 19px 0;
    justify-content: center;
    align-items: center;
    border-radius: 99px;
    background: #000;
    color: #fff;

    &:disabled {
        cursor: not-allowed;
    }
`;

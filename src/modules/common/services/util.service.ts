import { IPerPage, DEF_PER_COUNT, ListResponse } from "@dtos/page";

interface IToListResponeOptions extends IPerPage {
    total?: number;
}

export abstract class UtilService {

    public static DEF_PER_OBJ: IPerPage = {
        perNum: DEF_PER_COUNT,
        page: 1
    };

    /**
     * 计算页数
     * @param total 总数
     * @param perNum 每页显示数
     */
    public static calPageCount(
        total: number, perNum = UtilService.DEF_PER_OBJ.perNum
    ) {
        return Math.ceil(total / perNum);
    }

    public static toListRespone<T>(
        arr: T[], opts: IToListResponeOptions = UtilService.DEF_PER_OBJ
    ) {
        const perNum = opts.perNum || UtilService.DEF_PER_OBJ.perNum;
        const listRes = new ListResponse<T>();
        listRes.total = opts.total || arr.length;
        listRes.current = opts.page || UtilService.DEF_PER_OBJ.page;
        listRes.totalPages =
            UtilService.calPageCount(listRes.total, perNum);

        if (opts.total && listRes.totalPages >= listRes.current) {
            listRes.data = arr;
        } else {
            const startIndex = (listRes.current - 1) * perNum;
            listRes.data = arr.slice(startIndex, startIndex + perNum);
        }
        return listRes;
    }

}
